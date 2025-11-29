export interface Money {
    centAmount: number;
    currencyCode: string;
}

export interface Reference {
    typeId: string;
    id: string;
}

export interface LocalizedString {
    [locale: string]: string;
}

export interface Image {
    url: string;
    label?: string;
    dimensions: { w: number; h: number };
}

export interface Attribute {
    name: string;
    value: any;
}

export interface Price {
    id: string;
    value: Money;
    country?: string;
    customerGroup?: Reference;
    channel?: Reference;
    validFrom?: string;
    validUntil?: string;
    discounted?: {
        value: Money;
        discount: Reference;
    };
}

export interface ProductVariant {
    id: number;
    sku?: string;
    key?: string;
    prices?: Price[];
    attributes?: Attribute[];
    images?: Image[];
    availability?: {
        isOnStock: boolean;
        availableQuantity: number;
    };
}

export interface ProductData {
    name: LocalizedString;
    description?: LocalizedString;
    slug: LocalizedString;
    categories?: Reference[];
    categoryOrderHints?: Record<string, string>;
    metaTitle?: LocalizedString;
    metaDescription?: LocalizedString;
    metaKeywords?: LocalizedString;
    masterVariant: ProductVariant;
    variants?: ProductVariant[];
    searchKeywords?: Record<string, string[]>;
}

export interface MasterData {
    current: ProductData;
    staged?: ProductData;
    published: boolean;
    hasStagedChanges: boolean;
}

export interface ReviewRatingStatistics {
    averageRating: number;
    highestRating: number;
    lowestRating: number;
    count: number;
    ratingsDistribution?: Record<string, number>;
}

export interface Product {
    id: string;
    version: number;
    createdAt: string;
    lastModifiedAt: string;
    key?: string;
    productType: Reference;
    masterData: MasterData;
    taxCategory?: Reference;
    state?: Reference;
    reviewRatingStatistics?: ReviewRatingStatistics;
    priceMode?: "Platform" | "Embedded";
}

export type ProductWithMongoId = Omit<Product, "id"> & { _id: string };

export class ProductBody {
    id: string;
    version: number;
    createdAt: string;
    lastModifiedAt: string;
    key?: string;
    productType: Reference;
    masterData: MasterData;
    taxCategory?: Reference;
    state?: Reference;
    reviewRatingStatistics?: ReviewRatingStatistics;
    priceMode?: "Platform" | "Embedded";

    constructor(data: ProductWithMongoId) {
        this.id = data._id;
        this.version = data.version || 1;
        this.createdAt = data.createdAt;
        this.lastModifiedAt = data.lastModifiedAt;
        this.key = data.key;
        this.productType = data.productType;

        // Convert Maps to objects for localized strings
        this.masterData = {
            current: this.formatProductData(data.masterData.current),
            staged: data.masterData.staged ? this.formatProductData(data.masterData.staged) : undefined,
            published: data.masterData.published,
            hasStagedChanges: data.masterData.hasStagedChanges
        };

        this.taxCategory = data.taxCategory;
        this.state = data.state;
        this.reviewRatingStatistics = data.reviewRatingStatistics;
        this.priceMode = data.priceMode;
    }

    private formatProductData(data: any): ProductData {
        return {
            name: data.name instanceof Map ? Object.fromEntries(data.name) : data.name,
            description: data.description instanceof Map ? Object.fromEntries(data.description) : data.description,
            slug: data.slug instanceof Map ? Object.fromEntries(data.slug) : data.slug,
            categories: data.categories,
            categoryOrderHints: data.categoryOrderHints instanceof Map ? Object.fromEntries(data.categoryOrderHints) : data.categoryOrderHints,
            metaTitle: data.metaTitle instanceof Map ? Object.fromEntries(data.metaTitle) : data.metaTitle,
            metaDescription: data.metaDescription instanceof Map ? Object.fromEntries(data.metaDescription) : data.metaDescription,
            metaKeywords: data.metaKeywords instanceof Map ? Object.fromEntries(data.metaKeywords) : data.metaKeywords,
            masterVariant: data.masterVariant,
            variants: data.variants,
            searchKeywords: data.searchKeywords instanceof Map ? Object.fromEntries(data.searchKeywords) : data.searchKeywords
        };
    }
}
