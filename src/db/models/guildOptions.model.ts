import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../index';

export const CENSOR_MODES = ['none', 'select', 'blur'] as const;
export type CensorMode = typeof CENSOR_MODES[number];

interface GuildOptionsAttributes {
    guildId: string
    createdAt?: Date;
    updatedAt?: Date;

    censorMode: CensorMode
}

export type GuildOptionsInput = Optional<GuildOptionsAttributes, 'guildId'>
export type GuildOptionsOutput = Required<GuildOptionsAttributes>
export type GuildOptionsUpdate = Omit<Partial<GuildOptionsAttributes>, 'guildId' | 'updatedAt' | 'createdAt'>;

class GuildOptions extends Model<GuildOptionsAttributes, GuildOptionsInput> implements GuildOptionsAttributes {
    guildId!: string;

    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;

    censorMode!: 'none' | 'select' | 'blur';
}

GuildOptions.init({
    guildId: {
        type: DataTypes.STRING(18), // 18 is the Discord server id length
        primaryKey: true,
        allowNull: false
    },
    censorMode: {
        type: DataTypes.ENUM(...CENSOR_MODES),
        allowNull: false,
        defaultValue: 'none',
    }
}, {
    timestamps: true,
    sequelize
});

export default GuildOptions;