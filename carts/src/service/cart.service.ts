import { buildCreateBodyObject, calculateTotalPrice } from '../common/utils/utilities';
import Cart from '../models/cartSchema';
import { CartBody, LineItem, Address, Money } from '../common/dtos/cart';
import HTTP_STATUS from '../common/constants/httpStatus';
import { v4 as uuidv4 } from 'uuid';

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
    static formatCart(doc: any) {
        if (!doc) return null;
        const obj = doc.toObject();
        return new CartBody(obj);
    }

    static async countCarts(): Promise<ServiceResponse<number>> {
        const total = await Cart.countDocuments();
        return { status: HTTP_STATUS.OK, code: "Success", data: total };
    }

    static async getAllCarts(page = 0, pageSize = 10, projection: any = null): Promise<ServiceResponse<any>> {
        const limit = pageSize > 0 ? pageSize : 10;
        const offset = page > 0 ? (page - 1) * limit : 0;
        const carts = await Cart.find({}, projection || undefined)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .exec();
        const results = carts.map(CartService.formatCart);
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
        const result = await Cart.findOne({ _id: cartId });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCart(result) };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Cart not found", data: null };
    }

    static async getCartByKey(key: string): Promise<ServiceResponse<CartBody | null>> {
        const result = await Cart.findOne({ key });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCart(result) };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Cart not found", data: null };
    }

    static async getCartByCustomerId(customerId: string): Promise<ServiceResponse<CartBody | null>> {
        const result = await Cart.findOne({ customerId, cartState: "Active" });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCart(result) };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", message: "Cart not found", data: null };
    }

    static async createCart({ clientId, data }: CreateCartParams): Promise<ServiceResponse<CartBody | null>> {
        if (data.key) {
            const existing = await Cart.findOne({ key: data.key });
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
            lineItems: data.lineItems || [],
            cartState: "Active"
        };

        const createBody = buildCreateBodyObject({ clientId, data: cartData });
        const result = await Cart.create(createBody);
        return {
            status: HTTP_STATUS.CREATED,
            code: "Success",
            data: CartService.formatCart(result)
        };
    }

    static async deleteCartById(cartId: string, version?: string): Promise<ServiceResponse<boolean>> {
        const query: any = { _id: cartId };
        if (version) {
            query.version = parseInt(version, 10);
        }
        const response = await Cart.deleteOne(query);
        if (response.deletedCount === 1) {
            return { status: HTTP_STATUS.NO_CONTENT, code: "Success", data: true };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
    }

    static async deleteCartByKey(key: string, version?: string): Promise<ServiceResponse<boolean>> {
        const query: any = { key };
        if (version) {
            query.version = parseInt(version, 10);
        }
        const response = await Cart.deleteOne(query);
        if (response.deletedCount === 1) {
            return { status: HTTP_STATUS.NO_CONTENT, code: "Success", data: true };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: false };
    }

    static async updateCartById(cartId: string, updateInfo: UpdateInfo): Promise<ServiceResponse<CartBody | null>> {
        return CartService.updateCart({ _id: cartId }, updateInfo);
    }

    static async updateCartByKey(key: string, updateInfo: UpdateInfo): Promise<ServiceResponse<CartBody | null>> {
        return CartService.updateCart({ key }, updateInfo);
    }

    private static async updateCart(query: any, updateInfo: UpdateInfo): Promise<ServiceResponse<CartBody | null>> {
        const { actions, version } = updateInfo;

        if (!actions.length) {
            return { status: HTTP_STATUS.BAD_REQUEST, code: "InvalidAction", message: "No actions provided", data: null };
        }

        const action = actions[0];
        let updateData: any = { lastModifiedAt: new Date().toISOString() };
        let updateOperation: any = { $set: updateData, $inc: { version: 1 } };

        switch (action.action) {
            case "addLineItem":
                // In real implementation, fetch product details from products service
                const lineItem = {
                    id: uuidv4(),
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
                    }
                };

                const addResult = await Cart.updateOne(
                    { ...query, version },
                    {
                        $push: { lineItems: lineItem },
                        ...updateOperation
                    }
                );

                if (addResult.modifiedCount === 1) {
                    const updated = await Cart.findOne(query);
                    if (updated) {
                        // Recalculate total price
                        const totalPrice = calculateTotalPrice(updated.lineItems, updated.customLineItems);
                        await Cart.updateOne({ _id: updated._id }, { $set: { totalPrice } });
                        const final = await Cart.findOne(query);
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCart(final) };
                    }
                }
                break;

            case "removeLineItem":
                const removeResult = await Cart.updateOne(
                    { ...query, version },
                    {
                        $pull: { lineItems: { id: action.lineItemId } },
                        ...updateOperation
                    }
                );

                if (removeResult.modifiedCount === 1) {
                    const updated = await Cart.findOne(query);
                    if (updated) {
                        const totalPrice = calculateTotalPrice(updated.lineItems, updated.customLineItems);
                        await Cart.updateOne({ _id: updated._id }, { $set: { totalPrice } });
                        const final = await Cart.findOne(query);
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCart(final) };
                    }
                }
                break;

            case "changeLineItemQuantity":
                const cart = await Cart.findOne({ ...query, version });
                if (cart) {
                    const lineItemIndex = cart.lineItems.findIndex((item: any) => item.id === action.lineItemId);
                    if (lineItemIndex !== -1) {
                        cart.lineItems[lineItemIndex].quantity = action.quantity;
                        cart.lineItems[lineItemIndex].totalPrice.centAmount =
                            cart.lineItems[lineItemIndex].price.value.centAmount * action.quantity;
                        cart.version += 1;
                        cart.lastModifiedAt = new Date().toISOString();
                        const totalPrice = calculateTotalPrice(cart.lineItems, cart.customLineItems);
                        cart.totalPrice = totalPrice;
                        await cart.save();
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCart(cart) };
                    }
                }
                break;

            case "setShippingAddress":
                updateData.shippingAddress = action.address;
                const shippingResult = await Cart.updateOne(
                    { ...query, version },
                    updateOperation
                );
                if (shippingResult.modifiedCount === 1) {
                    const updated = await Cart.findOne(query);
                    if (updated) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCart(updated) };
                    }
                }
                break;

            case "setBillingAddress":
                updateData.billingAddress = action.address;
                const billingResult = await Cart.updateOne(
                    { ...query, version },
                    updateOperation
                );
                if (billingResult.modifiedCount === 1) {
                    const updated = await Cart.findOne(query);
                    if (updated) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCart(updated) };
                    }
                }
                break;

            case "setCustomerEmail":
                updateData.customerEmail = action.email;
                const emailResult = await Cart.updateOne(
                    { ...query, version },
                    updateOperation
                );
                if (emailResult.modifiedCount === 1) {
                    const updated = await Cart.findOne(query);
                    if (updated) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCart(updated) };
                    }
                }
                break;

            case "setCartState":
                updateData.cartState = action.state;
                const stateResult = await Cart.updateOne(
                    { ...query, version },
                    updateOperation
                );
                if (stateResult.modifiedCount === 1) {
                    const updated = await Cart.findOne(query);
                    if (updated) {
                        return { status: HTTP_STATUS.OK, code: "Success", data: CartService.formatCart(updated) };
                    }
                }
                break;

            default:
                return { status: HTTP_STATUS.BAD_REQUEST, code: "InvalidAction", message: "Unknown action", data: null };
        }

        const existing = await Cart.findOne(query);
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

    static async checkCartExistsById(cartId: string): Promise<ServiceResponse<string | null>> {
        const result = await Cart.findOne({ _id: cartId });
        if (result) {
            return { status: HTTP_STATUS.OK, code: "Success", data: result.lastModifiedAt };
        }
        return { status: HTTP_STATUS.NOT_FOUND, code: "ResourceNotFound", data: null };
    }

    static async checkCartsExist(): Promise<ServiceResponse<{ lastUpdatedTime: string | undefined; cartCount: number }>> {
        const latestCart = await Cart.findOne().sort({ lastModifiedAt: -1 });
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
