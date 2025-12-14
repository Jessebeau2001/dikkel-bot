import sequelize from '@/db';
import UserMetric from '@/db/models/userMetric.model';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function incrementRaw(userId: string, guildId: string, metric: string) {
    await sequelize.query(`
        INSERT INTO UserMetrics (userId, guildId, key, value, createdAt, updatedAt)
        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(userId, guildId, key)
        DO UPDATE SET value = value + 1, updatedAt = CURRENT_TIMESTAMP
    `, { replacements: [userId, guildId, metric] });
}

export async function incrementMetric(userId: string, guildId: string, key: string): Promise<void> {
    try {
        const [ row ] = await UserMetric.findOrCreate({
            where: { userId, guildId, key },
        });
        await row.increment('value');
    } catch (err) {
        if (typeof err === 'object' && 'name' in err! && err.name === 'SequelizeUniqueConstraintError') {
            // Try to recover from a unique constraint error
            await UserMetric.increment('value', {
                where: { userId, guildId, key },
                by: 1
            });
        } else {
            throw err;
        }
    }
}

// Fire and forget type method
export async function tryIncrementMetric(userId: string, guildId: string, key: string) {
    try {
        await incrementMetric(userId, guildId, key);
    } catch (err) {
        console.log(`Could not increment ${key}`, err);
    }
}