import { buildCreateBodyObject } from '../common/utils/utilities';
import Payment from '../models/paymentSchema';
import { PaymentBody, Money, Reference, Transaction } from '../common/dtos/payment';
import HTTP_STATUS from '../common/constants/httpStatus';
import { v4 as uuidv4 } from 'uuid';

interface ServiceResponse<T> {
    status: number;
    code: string;
    message?: string;
    data?: T;
    [key: string]: any;
}

interface CreatePaymentParams {
    clientId: string;
    data: {
        key?: string;
        amountPlanned: Money;
        customer?: Reference;
        paymentMethodInfo?: {
            paymentInterface?: string;
            method?: string;
            name?: Record<string, string>;
        };
    };
}

interface AddTransactionAction {
    action: "addTransaction";
    transaction: Omit<Transaction, "id">;
}

interface ChangeAmountPlannedAction {
    action: "changeAmountPlanned";
    amount: Money;
}

interface SetCustomerAction {
    action: "setCustomer";
    customer?: Reference;
}

type PaymentAction = AddTransactionAction | ChangeAmountPlannedAction | SetCustomerAction;

interface UpdateInfo {
    version: number;
    actions: PaymentAction[];
}

class PaymentService {
    static formatPayment(doc: any) {
        if (!doc) return null;
        const obj = doc.toObject();
        return new PaymentBody({
            ...obj,
            paymentMethodInfo: obj.paymentMethodInfo ? {
                ...obj.paymentMethodInfo,
                name: obj.paymentMethodInfo.name instanceof Map
                    ? Object.fromEntries(obj.paymentMethodInfo.name)
                    : obj.paymentMethodInfo.name
            } : undefined
        });
    }

    static async countPayments(): Promise<ServiceResponse<number>> {
        const total = await Payment.countDocuments();
        return { status: HTTP_STATUS.OK, code: "Success", data: total };
    }

    static async getAllPayments(page = 0, pageSize = 10, projection: any = null): Promise<ServiceResponse<any>> {
        const limit = pageSize > 0 ? pageSize : 10;
        const offset = page > 0 ? (page - 1) * limit : 0;
        const payments = await Payment.find({}, projection || undefined)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .exec();
        const results = payments.map(PaymentService.formatPayment);
        const totalRes = await PaymentService.countPayments();
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

    static async getPaymentById(paymentId: string): Promise<ServiceResponse<PaymentBody | null>> {
        const result = await Payment.findOne({ _id: paymentId });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: PaymentService.formatPayment(result) };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Payment not found", data: null };
    }

    static async getPaymentByKey(key: string): Promise<ServiceResponse<PaymentBody | null>> {
        const result = await Payment.findOne({ key });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: PaymentService.formatPayment(result) };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Payment not found", data: null };
    }

    static async createPayment({ clientId, data }: CreatePaymentParams): Promise<ServiceResponse<PaymentBody | null>> {
        if (data.key) {
            const existing = await Payment.findOne({ key: data.key });
            if (existing) {
                return {
                    status: HTTP_STATUS.BAD_REQUEST,
                    code: "DuplicateValue",
                    duplicatedValue: data.key,
                    data: null
                };
            }
        }
        const createBody = buildCreateBodyObject({ clientId, data });
        const result = await Payment.create(createBody);
        return {
            status: HTTP_STATUS.CREATED,
            code: "Success",
            data: PaymentService.formatPayment(result)
        };
    }

    static async deletePaymentById(paymentId: string, version?: string): Promise<ServiceResponse<boolean>> {
        const query: any = { _id: paymentId };
        if (version) {
            query.version = parseInt(version, 10);
        }
        const response = await Payment.deleteOne(query);
        if (response.deletedCount === 1) {
            return { status: HTTP_STATUS.NO_CONTENT, code: "Success", data: true };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
    }

    static async deletePaymentByKey(key: string, version?: string): Promise<ServiceResponse<boolean>> {
        const query: any = { key };
        if (version) {
            query.version = parseInt(version, 10);
        }
        const response = await Payment.deleteOne(query);
        if (response.deletedCount === 1) {
            return { status: HTTP_STATUS.NO_CONTENT, code: "Success", data: true };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
    }

    static async updatePaymentById(paymentId: string, updateInfo: UpdateInfo): Promise<ServiceResponse<PaymentBody | null>> {
        return PaymentService.updatePayment({ _id: paymentId }, updateInfo);
    }

    static async updatePaymentByKey(key: string, updateInfo: UpdateInfo): Promise<ServiceResponse<PaymentBody | null>> {
        return PaymentService.updatePayment({ key }, updateInfo);
    }

    private static async updatePayment(query: any, updateInfo: UpdateInfo): Promise<ServiceResponse<PaymentBody | null>> {
        const { actions, version } = updateInfo;

        if (!actions.length) {
            return { status: HTTP_STATUS.BAD_REQUEST, code: "InvalidAction", message: "No actions provided", data: null };
        }

        const action = actions[0];
        let updateData: any = { lastModifiedAt: new Date().toISOString() };

        switch (action.action) {
            case "addTransaction":
                const transaction = {
                    ...action.transaction,
                    id: uuidv4(),
                    timestamp: new Date().toISOString()
                };
                const updateResult = await Payment.updateOne(
                    { ...query, version },
                    {
                        $push: { transactions: transaction },
                        $set: updateData,
                        $inc: { version: 1 }
                    }
                );
                if (updateResult.modifiedCount === 1) {
                    const updated = await Payment.findOne(query);
                    if (updated) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: PaymentService.formatPayment(updated) };
                    }
                }
                break;

            case "changeAmountPlanned":
                updateData.amountPlanned = action.amount;
                const amountResult = await Payment.updateOne(
                    { ...query, version },
                    {
                        $set: updateData,
                        $inc: { version: 1 }
                    }
                );
                if (amountResult.modifiedCount === 1) {
                    const updated = await Payment.findOne(query);
                    if (updated) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: PaymentService.formatPayment(updated) };
                    }
                }
                break;

            case "setCustomer":
                updateData.customer = action.customer;
                const customerResult = await Payment.updateOne(
                    { ...query, version },
                    {
                        $set: updateData,
                        $inc: { version: 1 }
                    }
                );
                if (customerResult.modifiedCount === 1) {
                    const updated = await Payment.findOne(query);
                    if (updated) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: PaymentService.formatPayment(updated) };
                    }
                }
                break;

            default:
                return { status: HTTP_STATUS.BAD_REQUEST, code: "InvalidAction", message: "Unknown action", data: null };
        }

        const existing = await Payment.findOne(query);
        if (existing) {
            return {
                status: HTTP_STATUS.CONFLICT,
                code: "ConcurrentModification",
                conflictedVersion: existing.version,
                data: null
            };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Payment not found", data: null };
    }

    static async checkPaymentExistsById(paymentId: string): Promise<ServiceResponse<string | null>> {
        const result = await Payment.findOne({ _id: paymentId });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: result.lastModifiedAt };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: null };
    }

    static async checkPaymentsExist(): Promise<ServiceResponse<{ lastUpdatedTime: string | undefined; paymentCount: number }>> {
        const latestPayment = await Payment.findOne().sort({ lastModifiedAt: -1 });
        const lastUpdatedTime = latestPayment?.lastModifiedAt;
        const totalRes = await PaymentService.countPayments();
        return {
            status: HTTP_STATUS.OK,
            code: "Success",
            data: {
                lastUpdatedTime,
                paymentCount: typeof totalRes.data === 'number' ? totalRes.data : 0
            }
        };
    }
}

export default PaymentService;
