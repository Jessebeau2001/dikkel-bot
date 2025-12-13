import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../index';

interface GuildOptionsAttributes {
    guildId: string
    createdAt?: Date;
    updatedAt?: Date;
}

export type GuildOptionsInput = Optional<GuildOptionsAttributes, 'guildId'>
export type GuildOptionsOutput = Required<GuildOptionsAttributes>

class GuildOptions extends Model<GuildOptionsAttributes, GuildOptionsInput> implements GuildOptionsAttributes {
    guildId!: string;

    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
}

GuildOptions.init({
    guildId: {
        type: DataTypes.STRING(18), // 18 is the Discord server id length
        primaryKey: true,
        allowNull: false
    }
}, {
    timestamps: true,
    sequelize
});

export default GuildOptions;