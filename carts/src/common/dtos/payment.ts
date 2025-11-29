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

export interface Transaction {
    id: string;
    timestamp: string;
    type: "Authorization" | "Charge" | "Refund" | "CancelAuthorization";
    amount: Money;
    interactionId?: string;
    state: "Initial" | "Pending" | "Success" | "Failure";
}

export interface CustomFields {
    type: Reference;
    fields: Record<string, any>;
}

export interface Payment {
    id: string;
    version: number;
    createdAt: string;
    lastModifiedAt: string;
    key?: string;
    amountPlanned: Money;
    customer?: Reference;
    paymentMethodInfo?: {
        paymentInterface?: string;
        method?: string;
        name?: LocalizedString;
    };
    paymentStatus?: {
        interfaceCode?: string;
        interfaceText?: string;
        state?: Reference;
    };
    transactions?: Transaction[];
    custom?: CustomFields;
}

export type PaymentWithMongoId = Omit<Payment, "id"> & { _id: string };

export class PaymentBody {
    id: string;
    version: number;
    createdAt: string;
    lastModifiedAt: string;
    key?: string;
    amountPlanned: Money;
    customer?: Reference;
    paymentMethodInfo?: {
        paymentInterface?: string;
        method?: string;
        name?: LocalizedString;
    };
    paymentStatus?: {
        interfaceCode?: string;
        interfaceText?: string;
        state?: Reference;
    };
    transactions?: Transaction[];
    custom?: CustomFields;

    constructor(data: PaymentWithMongoId) {
        this.id = data._id;
        this.version = data.version || 1;
        this.createdAt = data.createdAt;
        this.lastModifiedAt = data.lastModifiedAt;
        this.key = data.key;
        this.amountPlanned = data.amountPlanned;
        this.customer = data.customer;
        this.paymentMethodInfo = data.paymentMethodInfo;
        this.paymentStatus = data.paymentStatus;
        this.transactions = data.transactions;
        this.custom = data.custom;
    }
}
