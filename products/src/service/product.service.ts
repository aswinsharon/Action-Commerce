import { buildCreateBodyObject } from '../common/utils/utilities';
import Product from '../models/productSchema';
import { ProductBody, ProductVariant, Price } from '../common/dtos/product';
import HTTP_STATUS from '../common/constants/httpStatus';
import { v4 as uuidv4 } from 'uuid';

interface ServiceResponse<T> {
    status: number;
    code: string;
    message?: string;
    data?: T;
    [key: string]: any;
}

interface CreateProductParams {
    clientId: string;
    data: {
        key?: string;
        productType: { typeId: string; id: string };
        name: Record<string, string>;
        slug: Record<string, string>;
        description?: Record<string, string>;
        categories?: Array<{ typeId: string; id: string }>;
        masterVariant: ProductVariant;
        variants?: ProductVariant[];
        taxCategory?: { typeId: string; id: string };
        publish?: boolean;
    };
}

interface ChangeNameAction {
    action: "changeName";
    name: Record<string, string>;
    staged?: boolean;
}

interface ChangeSlugAction {
    action: "changeSlug";
    slug: Record<string, string>;
    staged?: boolean;
}

interface SetDescriptionAction {
    action: "setDescription";
    description?: Record<string, string>;
    staged?: boolean;
}

interface AddToCategoryAction {
    action: "addToCategory";
    category: { typeId: string; id: string };
    staged?: boolean;
}

interface RemoveFromCategoryAction {
    action: "removeFromCategory";
    category: { typeId: string; id: string };
    staged?: boolean;
}

interface SetCategoryOrderHintAction {
    action: "setCategoryOrderHint";
    categoryId: string;
    orderHint?: string;
    staged?: boolean;
}

interface AddVariantAction {
    action: "addVariant";
    sku?: string;
    key?: string;
    prices?: Price[];
    images?: Array<{ url: string; label?: string; dimensions: { w: number; h: number } }>;
    attributes?: Array<{ name: string; value: any }>;
    staged?: boolean;
}

interface RemoveVariantAction {
    action: "removeVariant";
    id?: number;
    sku?: string;
    staged?: boolean;
}

interface AddPriceAction {
    action: "addPrice";
    variantId?: number;
    sku?: string;
    price: Omit<Price, 'id'>;
    staged?: boolean;
}

interface RemovePriceAction {
    action: "removePrice";
    priceId: string;
    staged?: boolean;
}

interface PublishAction {
    action: "publish";
}

interface UnpublishAction {
    action: "unpublish";
}

interface RevertStagedChangesAction {
    action: "revertStagedChanges";
}

type ProductAction =
    | ChangeNameAction
    | ChangeSlugAction
    | SetDescriptionAction
    | AddToCategoryAction
    | RemoveFromCategoryAction
    | SetCategoryOrderHintAction
    | AddVariantAction
    | RemoveVariantAction
    | AddPriceAction
    | RemovePriceAction
    | PublishAction
    | UnpublishAction
    | RevertStagedChangesAction;

interface UpdateInfo {
    version: number;
    actions: ProductAction[];
}

class ProductService {
    static formatProduct(doc: any) {
        if (!doc) return null;
        const obj = doc.toObject();
        return new ProductBody(obj);
    }

    static async countProducts(): Promise<ServiceResponse<number>> {
        const total = await Product.countDocuments();
        return { status: HTTP_STATUS.OK, code: "Success", data: total };
    }

    static async getAllProducts(page = 0, pageSize = 10, projection: any = null): Promise<ServiceResponse<any>> {
        const limit = pageSize > 0 ? pageSize : 10;
        const offset = page > 0 ? (page - 1) * limit : 0;

        // Use lean projection to reduce memory overhead
        const defaultProjection = projection || {
            _id: 1,
            version: 1,
            key: 1,
            createdAt: 1,
            lastModifiedAt: 1,
            'masterData.published': 1,
            'masterData.current.name': 1,
            'masterData.current.slug': 1,
            'masterData.current.description': 1,
            'masterData.current.categories': 1,
            'masterData.current.masterVariant.id': 1,
            'masterData.current.masterVariant.sku': 1,
            'masterData.current.masterVariant.prices': 1,
            'masterData.current.masterVariant.images': 1,
            'masterData.current.masterVariant.availability': 1,
            // Exclude heavy nested data by default
            'productType': 1,
            'reviewRatingStatistics': 1
        };

        const products = await Product.find({}, defaultProjection)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean() // Use lean() for better performance when not modifying documents
            .exec();

        const results = products.map(ProductService.formatProduct);
        const totalRes = await ProductService.countProducts();
        const totalPages = totalRes.data && limit ? Math.ceil(totalRes.data / limit) : 0;
        if (page > totalPages && totalPages > 0) {
            page = totalPages;
        }
        return {
            status: HTTP_STATUS.OK,
            code: "Success",
            data: { page, pageSize: results.length, totalPages, total: totalRes.data, results }
        };
    }

    static async getProductById(productId: string): Promise<ServiceResponse<ProductBody | null>> {
        const result = await Product.findOne({ _id: productId });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: ProductService.formatProduct(result) };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Product not found", data: null };
    }

    static async getProductByKey(key: string): Promise<ServiceResponse<ProductBody | null>> {
        const result = await Product.findOne({ key });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: ProductService.formatProduct(result) };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Product not found", data: null };
    }

    static async createProduct({ clientId, data }: CreateProductParams): Promise<ServiceResponse<ProductBody | null>> {
        if (data.key) {
            const existing = await Product.findOne({ key: data.key });
            if (existing) {
                return {
                    status: HTTP_STATUS.BAD_REQUEST,
                    code: "DuplicateValue",
                    duplicatedValue: data.key,
                    data: null
                };
            }
        }

        const productData: any = {
            name: data.name,
            slug: data.slug,
            description: data.description,
            categories: data.categories || [],
            masterVariant: data.masterVariant,
            variants: data.variants || []
        };

        const masterData = {
            current: productData,
            staged: productData,
            published: data.publish || false,
            hasStagedChanges: false
        };

        const createBody = buildCreateBodyObject({
            clientId,
            data: {
                ...data,
                masterData,
                priceMode: "Platform"
            }
        });

        const result = await Product.create(createBody);
        return {
            status: HTTP_STATUS.CREATED,
            code: "Success",
            data: ProductService.formatProduct(result)
        };
    }

    static async deleteProductById(productId: string, version?: string): Promise<ServiceResponse<boolean>> {
        const query: any = { _id: productId };
        if (version) {
            query.version = parseInt(version, 10);
        }
        const response = await Product.deleteOne(query);
        if (response.deletedCount === 1) {
            return { status: HTTP_STATUS.NO_CONTENT, code: "Success", data: true };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
    }

    static async deleteProductByKey(key: string, version?: string): Promise<ServiceResponse<boolean>> {
        const query: any = { key };
        if (version) {
            query.version = parseInt(version, 10);
        }
        const response = await Product.deleteOne(query);
        if (response.deletedCount === 1) {
            return { status: HTTP_STATUS.NO_CONTENT, code: "Success", data: true };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
    }

    static async updateProductById(productId: string, updateInfo: UpdateInfo): Promise<ServiceResponse<ProductBody | null>> {
        return ProductService.updateProduct({ _id: productId }, updateInfo);
    }

    static async updateProductByKey(key: string, updateInfo: UpdateInfo): Promise<ServiceResponse<ProductBody | null>> {
        return ProductService.updateProduct({ key }, updateInfo);
    }

    private static async updateProduct(query: any, updateInfo: UpdateInfo): Promise<ServiceResponse<ProductBody | null>> {
        const { actions, version } = updateInfo;

        if (!actions.length) {
            return { status: HTTP_STATUS.BAD_REQUEST, code: "InvalidAction", message: "No actions provided", data: null };
        }

        // Use optimistic locking with retry mechanism for concurrency
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            const product = await Product.findOne({ ...query, version: version + retryCount });
            if (!product) {
                const existing = await Product.findOne(query);
                if (existing) {
                    return {
                        status: HTTP_STATUS.CONFLICT,
                        code: "ConcurrentModification",
                        conflictedVersion: existing.version,
                        currentVersion: version,
                        data: null
                    };
                }
                return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Product not found", data: null };
            }

            if (!product.masterData) {
                return { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: "CorruptedData", message: "Product missing masterData", data: null };
            }

            for (const action of actions) {
                const staged = (action as any).staged !== false;
                const target = staged ? product.masterData.staged || product.masterData.current : product.masterData.current;

                if (!target) {
                    continue;
                }

                switch (action.action) {
                    case "changeName":
                        (target as any).name = action.name;
                        product.masterData.hasStagedChanges = staged;
                        break;

                    case "changeSlug":
                        (target as any).slug = action.slug;
                        product.masterData.hasStagedChanges = staged;
                        break;

                    case "setDescription":
                        (target as any).description = action.description;
                        product.masterData.hasStagedChanges = staged;
                        break;

                    case "addToCategory":
                        if (!target.categories) (target as any).categories = [];
                        const categoryExists = target.categories.some((cat: any) => cat.id === action.category.id);
                        if (!categoryExists) {
                            target.categories.push(action.category as any);
                        }
                        product.masterData.hasStagedChanges = staged;
                        break;

                    case "removeFromCategory":
                        if (target.categories) {
                            target.categories = target.categories.filter((cat: any) => cat.id !== action.category.id) as any;
                        }
                        product.masterData.hasStagedChanges = staged;
                        break;

                    case "addVariant":
                        const newVariant: ProductVariant = {
                            id: target.variants ? target.variants.length + 2 : 2,
                            sku: action.sku,
                            key: action.key,
                            prices: action.prices || [],
                            attributes: action.attributes || [],
                            images: action.images || [],
                            availability: { isOnStock: true, availableQuantity: 0 }
                        };
                        if (!target.variants) target.variants = [] as any;
                        target.variants.push(newVariant);
                        product.masterData.hasStagedChanges = staged;
                        break;

                    case "removeVariant":
                        if (target.variants) {
                            if (action.id) {
                                target.variants = target.variants.filter((v: any) => v.id !== action.id) as any;
                            } else if (action.sku) {
                                target.variants = target.variants.filter((v: any) => v.sku !== action.sku) as any;
                            }
                        }
                        product.masterData.hasStagedChanges = staged;
                        break;

                    case "addPrice":
                        const price: Price = {
                            id: uuidv4(),
                            ...action.price
                        };
                        let variant = action.variantId
                            ? (action.variantId === 1 ? target.masterVariant : target.variants?.find((v: any) => v.id === action.variantId))
                            : target.variants?.find((v: any) => v.sku === action.sku);

                        if (variant) {
                            if (!variant.prices) variant.prices = [] as any;
                            variant.prices.push(price);
                            product.masterData.hasStagedChanges = staged;
                        }
                        break;

                    case "removePrice":
                        const removeFromVariant = (v: any) => {
                            if (v.prices) {
                                v.prices = v.prices.filter((p: any) => p.id !== action.priceId) as any;
                            }
                        };
                        removeFromVariant(target.masterVariant);
                        target.variants?.forEach(removeFromVariant);
                        product.masterData.hasStagedChanges = staged;
                        break;

                    case "publish":
                        product.masterData.current = product.masterData.staged || product.masterData.current;
                        product.masterData.published = true;
                        product.masterData.hasStagedChanges = false;
                        break;

                    case "unpublish":
                        product.masterData.published = false;
                        break;

                    case "revertStagedChanges":
                        product.masterData.staged = JSON.parse(JSON.stringify(product.masterData.current));
                        product.masterData.hasStagedChanges = false;
                        break;

                    default:
                        return { status: HTTP_STATUS.BAD_REQUEST, code: "InvalidAction", message: "Unknown action", data: null };
                }
            }

            product.version += 1;
            product.lastModifiedAt = new Date().toISOString();

            try {
                // Use atomic update to prevent race conditions
                const updated = await Product.findOneAndUpdate(
                    { ...query, version: version + retryCount },
                    {
                        $set: {
                            masterData: product.masterData,
                            version: product.version,
                            lastModifiedAt: product.lastModifiedAt
                        }
                    },
                    { new: true }
                );

                if (updated) {
                    return { status: HTTP_STATUS.OK, code: "Success", data: ProductService.formatProduct(updated) };
                }

                // If update failed, retry
                retryCount++;
                if (retryCount >= maxRetries) {
                    return {
                        status: HTTP_STATUS.CONFLICT,
                        code: "ConcurrentModification",
                        message: "Failed to update after multiple retries due to concurrent modifications",
                        data: null
                    };
                }
            } catch (error: any) {
                if (error.code === 11000) { // Duplicate key error
                    return {
                        status: HTTP_STATUS.CONFLICT,
                        code: "ConcurrentModification",
                        message: "Concurrent modification detected",
                        data: null
                    };
                }
                throw error;
            }
        }

        return {
            status: HTTP_STATUS.CONFLICT,
            code: "ConcurrentModification",
            message: "Max retries exceeded",
            data: null
        };
    }

    static async checkProductExistsById(productId: string): Promise<ServiceResponse<string | null>> {
        const result = await Product.findOne({ _id: productId });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: result.lastModifiedAt };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: null };
    }

    static async checkProductsExist(): Promise<ServiceResponse<{ lastUpdatedTime: string | undefined; productCount: number }>> {
        const latestProduct = await Product.findOne().sort({ lastModifiedAt: -1 });
        const lastUpdatedTime = latestProduct?.lastModifiedAt;
        const totalRes = await ProductService.countProducts();
        return {
            status: HTTP_STATUS.OK,
            code: "Success",
            data: {
                lastUpdatedTime,
                productCount: typeof totalRes.data === 'number' ? totalRes.data : 0
            }
        };
    }

    // New optimized query methods

    static async getProductBySku(sku: string): Promise<ServiceResponse<ProductBody | null>> {
        // Use indexed query for SKU lookup
        const result = await Product.findOne({
            $or: [
                { 'masterData.current.masterVariant.sku': sku },
                { 'masterData.current.variants.sku': sku }
            ]
        }).lean();

        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: ProductService.formatProduct(result) };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Product not found", data: null };
    }

    static async getProductsByPriceRange(
        minPrice: number,
        maxPrice: number,
        currencyCode: string = 'USD',
        page = 1,
        pageSize = 10
    ): Promise<ServiceResponse<any>> {
        const limit = pageSize > 0 ? pageSize : 10;
        const offset = page > 0 ? (page - 1) * limit : 0;

        // Use aggregation pipeline for efficient price range queries
        const pipeline = [
            {
                $match: {
                    $or: [
                        {
                            'masterData.current.masterVariant.prices': {
                                $elemMatch: {
                                    'value.centAmount': { $gte: minPrice, $lte: maxPrice },
                                    'value.currencyCode': currencyCode
                                }
                            }
                        },
                        {
                            'masterData.current.variants.prices': {
                                $elemMatch: {
                                    'value.centAmount': { $gte: minPrice, $lte: maxPrice },
                                    'value.currencyCode': currencyCode
                                }
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    version: 1,
                    key: 1,
                    'masterData.current.name': 1,
                    'masterData.current.slug': 1,
                    'masterData.current.masterVariant.prices': 1,
                    'masterData.current.masterVariant.sku': 1,
                    'masterData.published': 1
                }
            },
            { $skip: offset },
            { $limit: limit }
        ];

        const products = await Product.aggregate(pipeline);
        const countPipeline = pipeline.slice(0, 1); // Only match stage for count
        const totalCount = await Product.aggregate([...countPipeline, { $count: 'total' }]);
        const total = totalCount.length > 0 ? totalCount[0].total : 0;
        const totalPages = limit ? Math.ceil(total / limit) : 0;

        return {
            status: HTTP_STATUS.OK,
            code: "Success",
            data: {
                page,
                pageSize: products.length,
                totalPages,
                total,
                results: products.map(ProductService.formatProduct)
            }
        };
    }

    static async getProductsByCategory(
        categoryId: string,
        page = 1,
        pageSize = 10
    ): Promise<ServiceResponse<any>> {
        const limit = pageSize > 0 ? pageSize : 10;
        const offset = page > 0 ? (page - 1) * limit : 0;

        // Optimized query with projection
        const products = await Product.find(
            { 'masterData.current.categories.id': categoryId },
            {
                _id: 1,
                version: 1,
                key: 1,
                'masterData.current.name': 1,
                'masterData.current.slug': 1,
                'masterData.current.masterVariant': 1,
                'masterData.published': 1
            }
        )
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean()
            .exec();

        const total = await Product.countDocuments({ 'masterData.current.categories.id': categoryId });
        const totalPages = limit ? Math.ceil(total / limit) : 0;

        return {
            status: HTTP_STATUS.OK,
            code: "Success",
            data: {
                page,
                pageSize: products.length,
                totalPages,
                total,
                results: products.map(ProductService.formatProduct)
            }
        };
    }

    static async updateProductPrice(
        productId: string,
        variantId: number,
        priceId: string,
        newPrice: { centAmount: number; currencyCode: string }
    ): Promise<ServiceResponse<boolean>> {
        // Atomic price update without loading entire document
        const variantPath = variantId === 1
            ? 'masterData.current.masterVariant.prices'
            : 'masterData.current.variants.$.prices';

        const query = variantId === 1
            ? { _id: productId }
            : { _id: productId, 'masterData.current.variants.id': variantId };

        const result = await Product.updateOne(
            { ...query, [`${variantPath}.id`]: priceId },
            {
                $set: {
                    [`${variantPath}.$.value`]: newPrice,
                    lastModifiedAt: new Date().toISOString()
                },
                $inc: { version: 1 }
            }
        );

        if (result.modifiedCount === 1) {
            return { status: HTTP_STATUS.OK, code: "Success", data: true };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
    }

    static async updateVariantStock(
        productId: string,
        sku: string,
        availableQuantity: number,
        isOnStock: boolean
    ): Promise<ServiceResponse<boolean>> {
        // Atomic stock update for high-frequency inventory changes
        const result = await Product.updateOne(
            {
                _id: productId,
                $or: [
                    { 'masterData.current.masterVariant.sku': sku },
                    { 'masterData.current.variants.sku': sku }
                ]
            },
            {
                $set: {
                    'masterData.current.masterVariant.$[master].availability.availableQuantity': availableQuantity,
                    'masterData.current.masterVariant.$[master].availability.isOnStock': isOnStock,
                    'masterData.current.variants.$[variant].availability.availableQuantity': availableQuantity,
                    'masterData.current.variants.$[variant].availability.isOnStock': isOnStock,
                    lastModifiedAt: new Date().toISOString()
                },
                $inc: { version: 1 }
            },
            {
                arrayFilters: [
                    { 'master.sku': sku },
                    { 'variant.sku': sku }
                ]
            }
        );

        if (result.modifiedCount >= 1) {
            return { status: HTTP_STATUS.OK, code: "Success", data: true };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
    }
}

export default ProductService;
