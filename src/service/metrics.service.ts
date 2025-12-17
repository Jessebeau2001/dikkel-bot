import sequelize from '@/db';
import UserMetric from '@/db/models/userMetric.model';
import BufferedWriter from '@/lib/bufferedWriter';
import { Transaction } from 'sequelize';
import events from '@/app.events';
import { getRandomValue } from '@/lib/utils';

interface MetricInfo {
    userId: string;
    guildId: string;
    key: string;
}

interface MetricUpdate extends MetricInfo {
    value: number
}

const BUFFER = new BufferedWriter({
    maxBatchSize: 50,
    flushIntervalMs: 1000 * 10,
    writer: writeAll
});

events.onShutdown(async () => {
    await BUFFER.shutdown();
});

function hashMetric({ userId, guildId, key }: MetricInfo): string {
    return `${userId}:${guildId}:${key}`;
}

async function incrementOrCreate({ guildId, userId, key, value }: MetricUpdate, t: Transaction): Promise<void> {
    const [ rows ] = await UserMetric.increment('value', {
        by: value,
        where: { guildId, userId, key },
        transaction: t
    });

    // idk why this works the way it does
    const numRowsAffected = rows?.[1];
    if (!numRowsAffected) {
        await UserMetric.create(
            { guildId, userId, key, value },
            { transaction: t }
        );
    }
}

async function writeAll(values: MetricInfo[]) {
    console.log('Writing buffer...');

    const map = new Map<string, MetricUpdate>();
    for (const value of values) {
        const hash = hashMetric(value);
        const current = map.get(hash)?.value || 0;

        map.set(hash, { ...value, value: current + 1 });
    }

    const reducedValues = map.values().toArray();

    await sequelize.transaction(async (t) => {
        for (const update of reducedValues) {
            await incrementOrCreate(update, t);
        };
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function incrementRaw(userId: string, guildId: string, metric: string) {
    await sequelize.query(`
        INSERT INTO UserMetrics (userId, guildId, key, value, createdAt, updatedAt)
        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(userId, guildId, key)
        DO UPDATE SET value = value + 1, updatedAt = CURRENT_TIMESTAMP
    `, { replacements: [userId, guildId, metric] });
}

/**
 * Metric incrementing is set to be a promise for now, as im not sure how this will evolve in the future.
 * Keeping it a promise should(TM) make refactoring this less of a hassle later.
 */

// eslint-disable-next-line require-await
export async function incrementMetric(userId: string, guildId: string, key: string): Promise<void> {
    BUFFER.push({ userId, guildId, key });
}

// Fire and forget type method
export async function tryIncrementMetric(userId: string, guildId: string, key: string) {
    try {
        await incrementMetric(userId, guildId, key);
    } catch (err) {
        console.log(`Could not increment ${key}`, err);
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function simpleTest() {
    const users = [ 'test_user_1', 'test_user_2', 'test_user_3', 'test_user_4', ];
    const guilds = [ 'test_guild_1', 'test_guild_2', 'test_guild_3' ];
    const keys = [ 'test_cmd_1', 'test_cmd_2', 'test_cmd_3' ];

    for (let i = 0; i < 50; i++) {
		const guild = getRandomValue(guilds);
		const user = getRandomValue(users);
		const metric = getRandomValue(keys);
		incrementMetric(user, guild, metric);
	}
}
