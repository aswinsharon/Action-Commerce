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

export interface ProductVariant {
    id: number;
    sku?: string;
    key?: string;
    attributes?: Attribute[];
    images?: Image[];
}

export interface Price {
    value: Money;
    discounted?: {
        value: Money;
        discount: Reference;
    };
}

export interface LineItem {
    id: string;
    productId: string;
    productType: Reference;
    name: LocalizedString;
    variant: ProductVariant;
    quantity: number;
    price: Price;
    totalPrice: Money;
}

export interface CustomLineItem {
    id: string;
    name: LocalizedString;
    money: Money;
    quantity: number;
    totalPrice: Money;
}

export interface TaxPortion {
    rate: number;
    amount: Money;
}

export interface TaxedPrice {
    totalNet: Money;
    totalGross: Money;
    taxPortions?: TaxPortion[];
}

export interface Address {
    firstName?: string;
    lastName?: string;
    streetName?: string;
    city?: string;
    country: string;
}

export interface ShippingInfo {
    shippingMethodName: string;
    price: Money;
}

export interface DiscountCodeInfo {
    discountCode: Reference;
    state: "NotActive" | "MatchesCart" | "MaxApplicationReached" | "Applied";
}

export interface CustomFields {
    type: Reference;
    fields: Record<string, any>;
}

export interface Cart {
    id: string;
    version: number;
    createdAt: string;
    lastModifiedAt: string;
    key?: string;
    customerId?: string;
    customerEmail?: string;
    totalPrice: Money;
    taxedPrice?: TaxedPrice;
    lineItems: LineItem[];
    customLineItems?: CustomLineItem[];
    cartState: "Active" | "Merged" | "Ordered";
    shippingAddress?: Address;
    billingAddress?: Address;
    shippingInfo?: ShippingInfo;
    discountCodes?: DiscountCodeInfo[];
    custom?: CustomFields;
}

export type CartWithMongoId = Omit<Cart, "id"> & { _id: string };

export class CartBody {
    id: string;
    version: number;
    createdAt: string;
    lastModifiedAt: string;
    key?: string;
    customerId?: string;
    customerEmail?: string;
    totalPrice: Money;
    taxedPrice?: TaxedPrice;
    lineItems: LineItem[];
    customLineItems?: CustomLineItem[];
    cartState: "Active" | "Merged" | "Ordered";
    shippingAddress?: Address;
    billingAddress?: Address;
    shippingInfo?: ShippingInfo;
    discountCodes?: DiscountCodeInfo[];
    custom?: CustomFields;

    constructor(data: CartWithMongoId) {
        this.id = data._id;
        this.version = data.version || 1;
        this.createdAt = data.createdAt;
        this.lastModifiedAt = data.lastModifiedAt;
        this.key = data.key;
        this.customerId = data.customerId;
        this.customerEmail = data.customerEmail;
        this.totalPrice = data.totalPrice;
        this.taxedPrice = data.taxedPrice;
        this.lineItems = data.lineItems.map(item => ({
            ...item,
            name: item.name instanceof Map ? Object.fromEntries(item.name) : item.name
        }));
        this.customLineItems = data.customLineItems?.map(item => ({
            ...item,
            name: item.name instanceof Map ? Object.fromEntries(item.name) : item.name
        }));
        this.cartState = data.cartState;
        this.shippingAddress = data.shippingAddress;
        this.billingAddress = data.billingAddress;
        this.shippingInfo = data.shippingInfo;
        this.discountCodes = data.discountCodes;
        this.custom = data.custom;
    }
}
