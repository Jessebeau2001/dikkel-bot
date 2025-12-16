import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import sequelize from '../index';
import { MatchDetail } from '@/api/face-detect.api';

class AnalysisResult extends Model<
    InferAttributes<AnalysisResult, { omit: 'createdAt' | 'updatedAt' }>,
    InferCreationAttributes<AnalysisResult, { omit: 'createdAt' | 'updatedAt' }>
> {
    // declare id: CreationOptional<string>;
    
    declare contentHash: string;
    declare result: MatchDetail[] | null;
    declare analyzerVersion?: string;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    static async findByHash(contentHash: string) {
        return await AnalysisResult.findOne({
            where: { contentHash }
        });
    }
}

AnalysisResult.init({
    // id: {
    //     type: DataTypes.UUID,
    //     defaultValue: DataTypes.UUIDV4,
    //     primaryKey: true,
    //     allowNull: false
    // },
    contentHash: {
        type: DataTypes.STRING(64), // SHA-256
        primaryKey: true,
        allowNull: false
    },
    result: {
        type: DataTypes.JSON,
        allowNull: true
    },
    analyzerVersion: {
        type: DataTypes.TEXT('tiny'),
        allowNull: true
    }
}, {
    timestamps: true,
    sequelize
});

export default AnalysisResult;