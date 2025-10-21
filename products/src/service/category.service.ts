import axios from 'axios';
import { buildCreateBodyObject } from '../common/utils/utilities';
import category from '../models/baseProductSchema';
import { CategoryBody } from '../common/dtos/category';
import HTTP_STATUS from '../common/constants/httpStatus';

// interface ServiceResponse<T> {
//     status: number;
//     code: string;
//     message?: string;
//     data?: T;
//     [key: string]: any;
// }

// interface LocalizedString {
//     [locale: string]: string;
// }

// interface CategoryData {
//     name: LocalizedString;
//     sku?: LocalizedString;
// }

// interface CreateCategoryParams {
//     clientId: string;
//     data: CategoryData;
// }

// interface ChangeNameAction {
//     action: "changeName";
//     name: LocalizedString;
// }

// interface UpdateInfo {
//     version: number;
//     actions: ChangeNameAction[];
// }

class ProductService {

    public static async checkCategoryExistsById(categoryId: string): Promise<boolean> {
        const categoryExists = await axios.get(`https://api.example.com/categories/${categoryId}`)
        return !!categoryExists;
    };

    public static async createCategory(params: any): Promise<any> {
        try {
            const { clientId, data } = params;
            const body = buildCreateBodyObject(data);
            const verifyCategory
            const existingCategory = await category.findOne({ 'name.en': data.name.en }).exec();
            if (existingCategory) {
                return {
                    status: HTTP_STATUS.CONFLICT,
                    code: 'CATEGORY_ALREADY_EXISTS',
                    message: `Category with name ${data.name.en} already exists`
                };
            }

            const newCategory = new category(body);
            const savedCategory = await newCategory.save();

            return {
                status: HTTP_STATUS.CREATED,
                code: 'CATEGORY_CREATED',
                data: savedCategory as unknown as CategoryBody
            };
        } catch (error) {
            return {
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                code: 'CATEGORY_CREATION_FAILED',
                message: (error as Error).message
            };
        }
    }
}

export const productController = new ProductService();