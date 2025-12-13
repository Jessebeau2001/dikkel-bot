import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../index';

interface UserAttributes {
    id: number,
    name: string,
    description? : string
    createdAt?: Date;
    updatedAt?: Date;
}

export type UserInput = Optional<UserAttributes, 'id'>
export type UserOutput = Required<UserAttributes>

class User extends Model<UserAttributes, UserInput> implements UserAttributes {
    public id!: number;
    public name!: string;

    public description?: string;
    
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
}

User.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    }
}, {
    timestamps: true,
    sequelize
});

export default User;