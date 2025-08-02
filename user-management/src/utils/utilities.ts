import { v4 as uuidv4 } from 'uuid';

interface ClientInfo {
    clientId: string;
    isPlatformClient: boolean;
}

interface BuildCreateBodyInput<T = Record<string, any>> {
    version?: number;
    clientId: string;
    data: T;
}

interface CreatedObject<T = Record<string, any>> {
    _id: string;
    version: number;
    createdAt: string;
    lastModifiedAt: string;
    lastModifiedBy: ClientInfo;
    createdBy: ClientInfo;
    [key: string]: any;
}

export const buildCreateBodyObject = <T = Record<string, any>>({
    version = 1,
    clientId,
    data
}: BuildCreateBodyInput<T>): CreatedObject<T> => {
    const now = new Date().toISOString();
    const _id = uuidv4();

    return {
        _id,
        version,
        createdAt: now,
        lastModifiedAt: now,
        lastModifiedBy: {
            clientId,
            isPlatformClient: false
        },
        createdBy: {
            clientId,
            isPlatformClient: false
        },
        ...data
    };
};