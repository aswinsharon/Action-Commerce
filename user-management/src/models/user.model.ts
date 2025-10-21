import { DataTypes, Model, Sequelize } from 'sequelize';

export interface UserAttributes {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'customer' | 'manager';
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserCreationAttributes {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'admin' | 'customer' | 'manager';
    isActive?: boolean;
}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public email!: string;
    public password!: string;
    public firstName!: string;
    public lastName!: string;
    public role!: 'admin' | 'customer' | 'manager';
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initUserModel = (sequelize: Sequelize) => {
    User.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            firstName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            role: {
                type: DataTypes.ENUM('admin', 'customer', 'manager'),
                allowNull: false,
                defaultValue: 'customer',
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            sequelize,
            modelName: 'User',
            tableName: 'users',
            timestamps: true,
        }
    );

    return User;
};