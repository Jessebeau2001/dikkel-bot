import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, Optional } from 'sequelize';
import sequelize from '../index';

export const CENSOR_MODES = ['none', 'select', 'blur'] as const;
export type CensorMode = typeof CENSOR_MODES[number];

class GuildOptions extends Model<
    InferAttributes<GuildOptions, { omit: 'createdAt' | 'updatedAt' }>,
    InferCreationAttributes<GuildOptions, { omit: 'createdAt' | 'updatedAt' }>
> {
    declare guildId: string;
    declare censorMode: CensorMode;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

GuildOptions.init({
    guildId: {
        type: DataTypes.STRING(18), // 18 is the Discord server id length
        primaryKey: true,
        allowNull: false
    },
    censorMode: {
        type: DataTypes.ENUM(...CENSOR_MODES),
        defaultValue: 'none',
        allowNull: false
    },
}, {
    timestamps: true,
    sequelize
});

export type GuildOptionsInput = Optional<InferCreationAttributes<GuildOptions>, 'guildId' | 'createdAt' | 'updatedAt'>;
export type GuildOptionsOutput = Required<InferAttributes<GuildOptions>>;
export type GuildOptionsUpdate = Omit<Partial<InferAttributes<GuildOptions>>, 'guildId' | 'createdAt' | 'updatedAt'>;

export default GuildOptions;