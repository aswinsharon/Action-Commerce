export interface LocalizedString {
    [locale: string]: string;
}

export interface ClientInfo {
    clientId: string;
    isPlatformClient: boolean;
}

export interface Category {
    id: string;
    version?: number;
    createdAt: Date;
    lastModifiedAt: Date;
    name?: LocalizedString;
    slug?: LocalizedString;
    createdBy?: Partial<ClientInfo>;
    lastModifiedBy?: Partial<ClientInfo>;
}

export type CategoryWithMongoId = Omit<Category, "id"> & { _id: string };

export class CategoryBody {
    id: string;
    version: number;
    createdAt: Date;
    lastModifiedAt: Date;
    name?: LocalizedString;
    slug?: LocalizedString;
    createdBy?: ClientInfo;
    lastModifiedBy?: ClientInfo;

    constructor(data: CategoryWithMongoId) {
        this.id = data._id;
        this.version = data?.version || 1;
        this.createdAt = new Date(data.createdAt);
        this.lastModifiedAt = new Date(data.lastModifiedAt);
        this.name = data.name;
        this.slug = data.slug;
        this.createdBy = {
            clientId: data.createdBy?.clientId || '',
            isPlatformClient: data.createdBy?.isPlatformClient || false
        };
        this.lastModifiedBy = {
            clientId: data.lastModifiedBy?.clientId || '',
            isPlatformClient: data.lastModifiedBy?.isPlatformClient || false
        };
    }
}