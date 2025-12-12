import { buildCreateBodyObject } from '../common/utils/utilities';
import BaseCart from '../models/baseCartSchema';
import LineItem from '../models/lineItemSchema';
import CustomLineItem from '../models/customLineItemSchema';
import { CartBody, Address } from '../common/dtos/cart';
import HTTP_STATUS from '../common/constants/httpStatus';
import { v4 as uuidv4 } from 'uuid';
import { CacheService } from '../common/services/cache.service';

interface ServiceResponse<T> {
    status: number;
    code: string;
    message?: string;
    data?: T;
    [key: string]: any;
}

interface CreateCartParams {
    clientId: string;
    data: {
        key?: string;
        currency: string;
        customerId?: string;
        customerEmail?: string;
        lineItems?: any[];
    };
}

interface AddLineItemAction {
    action: "addLineItem";
    productId: string;
    variantId: number;
    quantity: number;
}

interface RemoveLineItemAction {
    action: "removeLineItem";
    lineItemId: string;
    quantity?: number;
}

interface ChangeLineItemQuantityAction {
    action: "changeLineItemQuantity";
    lineItemId: string;
    quantity: number;
}

interface SetShippingAddressAction {
    action: "setShippingAddress";
    address?: Address;
}

interface SetBillingAddressAction {
    action: "setBillingAddress";
    address?: Address;
}

interface SetCustomerEmailAction {
    action: "setCustomerEmail";
    email?: string;
}

interface SetCartStateAction {
    action: "setCartState";
    state: "Active" | "Merged" | "Ordered";
}

type CartAction =
    | AddLineItemAction
    | RemoveLineItemAction
    | ChangeLineItemQuantityAction
    | SetShippingAddressAction
    | SetBillingAddressAction
    | SetCustomerEmailAction
    | SetCartStateAction;

interface UpdateInfo {
    version: number;
    actions: CartAction[];
}

class CartService {
    private static cacheService = new CacheService();

    static async initializeCache(): Promise<void> {
        await CartService.cacheService.connect();
    }

    static formatCartFromAggregation(cartData: any): CartBody | null {
        if (!cartData) return null;

        // Transform line items to match the expected format
        const formattedLineItems = (cartData.lineItems || []).map((item: any) => ({
            id: item._id,
            productId: item.productId,
            productType: item.productType,
            name: item.name,
            variant: item.variant,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice
        }));

        // Transform custom line items to match the expected format
        const formattedCustomLineItems = (cartData.customLineItems || []).map((item: any) => ({
            id: item._id,
            name: item.name,
            money: item.money,
            quantity: item.quantity,
            totalPrice: item.totalPrice
        }));

        // Combine base cart with line items
        const fullCartData = {
            ...cartData,
            lineItems: formattedLineItems,
            customLineItems: formattedCustomLineItems
        };

        return new CartBody(fullCartData);
    }

    static getCartAggregationPipeline(matchStage: any, additionalStages: any[] = []): any[] {
        return [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'lineitems',
                    localField: '_id',
                    foreignField: 'cartId',
                    as: 'lineItems'
                }
            },
            {
                $lookup: {
                    from: 'customlineitems',
                    localField: '_id',
                    foreignField: 'cartId',
                    as: 'customLineItems'
                }
            },
            ...additionalStages
        ];
    }

    static async countCarts(): Promise<ServiceResponse<number>> {
        const total = await BaseCart.countDocuments();
        return { status: HTTP_STATUS.OK, code: "Success", data: total };
    }

    static async getAllCarts(page = 0, pageSize = 10, projection: any = null): Promise<ServiceResponse<any>> {
        const limit = pageSize > 0 ? pageSize : 10;
        const offset = page > 0 ? (page - 1) * limit : 0;

        // Use aggregation pipeline for efficient joining
        const pipeline = CartService.getCartAggregationPipeline(
            {}, // Match all carts
            [
                { $sort: { createdAt: -1 } },
                { $skip: offset },
                { $limit: limit }
            ]
        );

        if (projection) {
            pipeline.push({ $project: projection });
        }

        const carts = await BaseCart.aggregate(pipeline);
        const results = carts.map(cart => CartService.formatCartFromAggregation(cart));

        const totalRes = await CartService.countCarts();
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

    static async getCartById(cartId: string): Promise<ServiceResponse<CartBody | null>> {
        const cacheKey = CartService.cacheService.generateCartKey('id', cartId);

        // Try cache first
        const cached = await CartService.cacheService.get<CartBody>(cacheKey);
        if (cached) {
            return { status: HTTP_STATUS.OK, code: "Success", data: cached };
        }

        // Use aggregation pipeline for efficient joining
        const pipeline = CartService.getCartAggregationPipeline({ _id: cartId });
        const results = await BaseCart.aggregate(pipeline);

        if (results.length > 0) {
            const formattedCart = CartService.formatCartFromAggregation(results[0]);
            // Cache for 30 minutes
            await CartService.cacheService.set(cacheKey, formattedCart, 1800);
            return { status: HTTP_STATUS.OK, code: "Success", data: formattedCart };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Cart not found", data: null };
    }

    static async getCartByKey(key: string): Promise<ServiceResponse<CartBody | null>> {
        const cacheKey = CartService.cacheService.generateCartKey('key', key);

        // Try cache first
        const cached = await CartService.cacheService.get<CartBody>(cacheKey);
        if (cached) {
            return { status: HTTP_STATUS.OK, code: "Success", data: cached };
        }

        // Use aggregation pipeline for efficient joining
        const pipeline = CartService.getCartAggregationPipeline({ key });
        const results = await BaseCart.aggregate(pipeline);

        if (results.length > 0) {
            const formattedCart = CartService.formatCartFromAggregation(results[0]);
            // Cache for 30 minutes
            await CartService.cacheService.set(cacheKey, formattedCart, 1800);
            return { status: HTTP_STATUS.OK, code: "Success", data: formattedCart };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Cart not found", data: null };
    }

    static async getCartByCustomerId(customerId: string): Promise<ServiceResponse<CartBody | null>> {
        const cacheKey = CartService.cacheService.generateCartKey('customer', customerId);

        // Try cache first
        const cached = await CartService.cacheService.get<CartBody>(cacheKey);
        if (cached) {
            return { status: HTTP_STATUS.OK, code: "Success", data: cached };
        }

        // Use aggregation pipeline for efficient joining
        const pipeline = CartService.getCartAggregationPipeline({ customerId, cartState: "Active" });
        const results = await BaseCart.aggregate(pipeline);

        if (results.length > 0) {
            const formattedCart = CartService.formatCartFromAggregation(results[0]);
            // Cache for 15 minutes (shorter for active carts)
            await CartService.cacheService.set(cacheKey, formattedCart, 900);
            return { status: HTTP_STATUS.OK, code: "Success", data: formattedCart };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Cart not found", data: null };
    }

    static async createCart({ clientId, data }: CreateCartParams): Promise<ServiceResponse<CartBody | null>> {
        if (data.key) {
            const existing = await BaseCart.findOne({ key: data.key });
            if (existing) {
                return {
                    status: HTTP_STATUS.BAD_REQUEST,
                    code: "DuplicateValue",
                    duplicatedValue: data.key,
                    data: null
                };
            }
        }

        const cartData = {
            ...data,
            totalPrice: {
                centAmount: 0,
                currencyCode: data.currency
            },
            cartState: "Active"
        };

        const createBody = buildCreateBodyObject({ clientId, data: cartData });
        const baseCart = await BaseCart.create(createBody);

        // Create line items if provided
        if (data.lineItems && data.lineItems.length > 0) {
            const lineItemsToCreate = data.lineItems.map(item => ({
                ...item,
                cartId: baseCart._id,
                createdAt: baseCart.createdAt,
                lastModifiedAt: baseCart.lastModifiedAt
            }));
            await LineItem.insertMany(lineItemsToCreate);
        }

        // Invalidate related cache
        if (data.customerId) {
            await CartService.cacheService.del(CartService.cacheService.generateCartKey('customer', data.customerId));
        }
        await CartService.cacheService.delPattern('carts:list:*');

        // Use aggregation to get the complete cart data
        const pipeline = CartService.getCartAggregationPipeline({ _id: baseCart._id });
        const results = await BaseCart.aggregate(pipeline);
        const formattedCart = results.length > 0 ? CartService.formatCartFromAggregation(results[0]) : null;

        return {
            status: HTTP_STATUS.CREATED,
            code: "Success",
            data: formattedCart
        };
    }

    static async deleteCartById(cartId: string, version?: string): Promise<ServiceResponse<boolean>> {
        const query: any = { _id: cartId };
        if (version) {
            query.version = parseInt(version, 10);
        }

        // Delete base cart and related items in a transaction-like manner
        const baseCartResponse = await BaseCart.deleteOne(query);
        if (baseCartResponse.deletedCount === 1) {
            // Delete associated line items and custom line items
            await Promise.all([
                LineItem.deleteMany({ cartId }),
                CustomLineItem.deleteMany({ cartId })
            ]);

            // Invalidate cache
            await CartService.cacheService.delPattern(`cart:*:${cartId}*`);
            await CartService.cacheService.delPattern('carts:list:*');
            return { status: HTTP_STATUS.NO_CONTENT, code: "Success", data: true };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
    }

    static async deleteCartByKey(key: string, version?: string): Promise<ServiceResponse<boolean>> {
        const baseCart = await BaseCart.findOne({ key });
        if (!baseCart) {
            return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
        }

        const query: any = { key };
        if (version) {
            query.version = parseInt(version, 10);
        }

        const response = await BaseCart.deleteOne(query);
        if (response.deletedCount === 1) {
            // Delete associated line items and custom line items
            await Promise.all([
                LineItem.deleteMany({ cartId: baseCart._id }),
                CustomLineItem.deleteMany({ cartId: baseCart._id })
            ]);

            // Invalidate cache
            await CartService.cacheService.delPattern(`cart:*:${key}*`);
            await CartService.cacheService.delPattern('carts:list:*');
            return { status: HTTP_STATUS.NO_CONTENT, code: "Success", data: true };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
    }

    static async updateCartById(cartId: string, updateInfo: UpdateInfo): Promise<ServiceResponse<CartBody | null>> {
        const result = await CartService.updateCart({ _id: cartId }, updateInfo);

        // Invalidate cache on successful update
        if (result.status === HTTP_STATUS.OK) {
            await CartService.cacheService.delPattern(`cart:*:${cartId}*`);
            await CartService.cacheService.delPattern('carts:list:*');
        }

        return result;
    }

    static async updateCartByKey(key: string, updateInfo: UpdateInfo): Promise<ServiceResponse<CartBody | null>> {
        const result = await CartService.updateCart({ key }, updateInfo);

        // Invalidate cache on successful update
        if (result.status === HTTP_STATUS.OK) {
            await CartService.cacheService.delPattern(`cart:*:${key}*`);
            await CartService.cacheService.delPattern('carts:list:*');
        }

        return result;
    }

    private static async updateCart(query: any, updateInfo: UpdateInfo): Promise<ServiceResponse<CartBody | null>> {
        const { actions, version } = updateInfo;

        if (!actions.length) {
            return { status: HTTP_STATUS.BAD_REQUEST, code: "InvalidAction", message: "No actions provided", data: null };
        }

        const action = actions[0];
        const now = new Date().toISOString();
        let updateData: any = { lastModifiedAt: now };
        let updateOperation: any = { $set: updateData, $inc: { version: 1 } };

        switch (action.action) {
            case "addLineItem":
                // Find the base cart first
                const baseCart = await BaseCart.findOne({ ...query, version });
                if (!baseCart) {
                    return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Cart not found", data: null };
                }

                // Create new line item
                const lineItem = {
                    _id: uuidv4(),
                    cartId: baseCart._id,
                    productId: action.productId,
                    productType: { typeId: "product-type", id: "default" },
                    name: { en: "Product Name" }, // Should be fetched from product service
                    variant: {
                        id: action.variantId,
                        sku: `sku-${action.productId}`,
                        attributes: [],
                        images: []
                    },
                    quantity: action.quantity,
                    price: {
                        value: { centAmount: 1000, currencyCode: "USD" } // Should be fetched
                    },
                    totalPrice: {
                        centAmount: 1000 * action.quantity,
                        currencyCode: "USD"
                    },
                    createdAt: now,
                    lastModifiedAt: now
                };

                // Update base cart version and create line item
                const addResult = await BaseCart.updateOne(
                    { ...query, version },
                    updateOperation
                );

                if (addResult.modifiedCount === 1) {
                    await LineItem.create(lineItem);

                    // Recalculate total price
                    await CartService.recalculateTotalPrice(baseCart._id);

                    // Use aggregation to get updated cart
                    const pipeline = CartService.getCartAggregationPipeline({ _id: baseCart._id });
                    const results = await BaseCart.aggregate(pipeline);
                    if (results.length > 0) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCartFromAggregation(results[0]) };
                    }
                }
                break;

            case "removeLineItem":
                const removeBaseCart = await BaseCart.findOne({ ...query, version });
                if (!removeBaseCart) {
                    return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Cart not found", data: null };
                }

                const removeResult = await BaseCart.updateOne(
                    { ...query, version },
                    updateOperation
                );

                if (removeResult.modifiedCount === 1) {
                    await LineItem.deleteOne({ _id: action.lineItemId, cartId: removeBaseCart._id });

                    // Recalculate total price
                    await CartService.recalculateTotalPrice(removeBaseCart._id);

                    // Use aggregation to get updated cart
                    const pipeline = CartService.getCartAggregationPipeline({ _id: removeBaseCart._id });
                    const results = await BaseCart.aggregate(pipeline);
                    if (results.length > 0) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCartFromAggregation(results[0]) };
                    }
                }
                break;

            case "changeLineItemQuantity":
                const changeBaseCart = await BaseCart.findOne({ ...query, version });
                if (!changeBaseCart) {
                    return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Cart not found", data: null };
                }

                const lineItemToUpdate = await LineItem.findOne({ _id: action.lineItemId, cartId: changeBaseCart._id });
                if (lineItemToUpdate) {
                    const newTotalPrice = lineItemToUpdate.price.value.centAmount * action.quantity;

                    await Promise.all([
                        BaseCart.updateOne({ ...query, version }, updateOperation),
                        LineItem.updateOne(
                            { _id: action.lineItemId, cartId: changeBaseCart._id },
                            {
                                $set: {
                                    quantity: action.quantity,
                                    'totalPrice.centAmount': newTotalPrice,
                                    lastModifiedAt: now
                                }
                            }
                        )
                    ]);

                    // Recalculate total price
                    await CartService.recalculateTotalPrice(changeBaseCart._id);

                    // Use aggregation to get updated cart
                    const pipeline = CartService.getCartAggregationPipeline({ _id: changeBaseCart._id });
                    const results = await BaseCart.aggregate(pipeline);
                    if (results.length > 0) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCartFromAggregation(results[0]) };
                    }
                }
                break;

            case "setShippingAddress":
                updateData.shippingAddress = action.address;
                const shippingResult = await BaseCart.updateOne(
                    { ...query, version },
                    updateOperation
                );
                if (shippingResult.modifiedCount === 1) {
                    // Use aggregation to get updated cart
                    const pipeline = CartService.getCartAggregationPipeline(query);
                    const results = await BaseCart.aggregate(pipeline);
                    if (results.length > 0) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCartFromAggregation(results[0]) };
                    }
                }
                break;

            case "setBillingAddress":
                updateData.billingAddress = action.address;
                const billingResult = await BaseCart.updateOne(
                    { ...query, version },
                    updateOperation
                );
                if (billingResult.modifiedCount === 1) {
                    // Use aggregation to get updated cart
                    const pipeline = CartService.getCartAggregationPipeline(query);
                    const results = await BaseCart.aggregate(pipeline);
                    if (results.length > 0) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCartFromAggregation(results[0]) };
                    }
                }
                break;

            case "setCustomerEmail":
                updateData.customerEmail = action.email;
                const emailResult = await BaseCart.updateOne(
                    { ...query, version },
                    updateOperation
                );
                if (emailResult.modifiedCount === 1) {
                    // Use aggregation to get updated cart
                    const pipeline = CartService.getCartAggregationPipeline(query);
                    const results = await BaseCart.aggregate(pipeline);
                    if (results.length > 0) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCartFromAggregation(results[0]) };
                    }
                }
                break;

            case "setCartState":
                updateData.cartState = action.state;
                const stateResult = await BaseCart.updateOne(
                    { ...query, version },
                    updateOperation
                );
                if (stateResult.modifiedCount === 1) {
                    // Use aggregation to get updated cart
                    const pipeline = CartService.getCartAggregationPipeline(query);
                    const results = await BaseCart.aggregate(pipeline);
                    if (results.length > 0) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCartFromAggregation(results[0]) };
                    }
                }
                break;

            default:
                return { status: HTTP_STATUS.BAD_REQUEST, code: "InvalidAction", message: "Unknown action", data: null };
        }

        const existing = await BaseCart.findOne(query);
        if (existing) {
            return {
                status: HTTP_STATUS.CONFLICT,
                code: "ConcurrentModification",
                conflictedVersion: existing.version,
                data: null
            };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Cart not found", data: null };
    }

    private static async recalculateTotalPrice(cartId: string): Promise<void> {
        // Use aggregation to calculate total price efficiently
        const pipeline = [
            { $match: { cartId } },
            {
                $group: {
                    _id: null,
                    totalCentAmount: { $sum: "$totalPrice.centAmount" }
                }
            }
        ];

        const [lineItemsTotal, customLineItemsTotal] = await Promise.all([
            LineItem.aggregate(pipeline),
            CustomLineItem.aggregate(pipeline)
        ]);

        const lineItemsCentAmount = lineItemsTotal.length > 0 ? lineItemsTotal[0].totalCentAmount : 0;
        const customLineItemsCentAmount = customLineItemsTotal.length > 0 ? customLineItemsTotal[0].totalCentAmount : 0;

        // Get currency from base cart
        const baseCart = await BaseCart.findOne({ _id: cartId }, { totalPrice: 1 });
        const currencyCode = baseCart?.totalPrice?.currencyCode || "USD";

        const totalPrice = {
            centAmount: lineItemsCentAmount + customLineItemsCentAmount,
            currencyCode
        };

        await BaseCart.updateOne({ _id: cartId }, { $set: { totalPrice } });
    }

    static async checkCartExistsById(cartId: string): Promise<ServiceResponse<string | null>> {
        const result = await BaseCart.findOne({ _id: cartId });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: result.lastModifiedAt };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: null };
    }

    static async checkCartsExist(): Promise<ServiceResponse<{ lastUpdatedTime: string | undefined; cartCount: number }>> {
        const latestCart = await BaseCart.findOne().sort({ lastModifiedAt: -1 });
        const lastUpdatedTime = latestCart?.lastModifiedAt;
        const totalRes = await CartService.countCarts();
        return {
            status: HTTP_STATUS.OK,
            code: "Success",
            data: {
                lastUpdatedTime,
                cartCount: typeof totalRes.data === 'number' ? totalRes.data : 0
            }
        };
    }
}

export default CartService;