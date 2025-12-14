import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, Optional } from 'sequelize';
import sequelize from '../index';;

class UserMetric extends Model<
    InferAttributes<UserMetric, { omit: 'createdAt' | 'updatedAt' }>,
    InferCreationAttributes<UserMetric, { omit: 'createdAt' | 'updatedAt' }>
> {
    declare userId: string;
    declare guildId: string;

    declare key: string;
    declare value: number;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

UserMetric.init({
    userId: {
        type: DataTypes.STRING(18),
        primaryKey: true,
        allowNull: false
    },
    guildId: {
        type: DataTypes.STRING(18),
        primaryKey: true,
        allowNull: false
    },
    key: {
        type: DataTypes.STRING(32),
        primaryKey: true,
        allowNull: false
    },
    value: {
        type: DataTypes.INTEGER({ unsigned: true }),
        allowNull: false,
        defaultValue: 0
    }
}, {
    timestamps: true,
    sequelize
});

export type UserMetricInput = Optional<InferCreationAttributes<UserMetric>, 'userId' | 'guildId' | 'createdAt' | 'updatedAt'>;
export type UserMetricUpdate = Omit<Partial<InferAttributes<UserMetric>>, 'userId' | 'guildId' | 'createdAt' | 'updatedAt'>;

export default UserMetric;