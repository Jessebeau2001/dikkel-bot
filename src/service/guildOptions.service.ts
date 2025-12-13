// import GuildOptions from '@/db/models/guildOptions.model';
import SimpleLRUCache from '../cache';
import GuildOptions from '../db/models/guildOptions.model';
import { UniqueConstraintError } from 'sequelize';

// Could be moved to dal layer when logic gets more complex
const GUILD_CACHE = new SimpleLRUCache<string, GuildOptions>({
    max: 100,
    ttlMs: 60*1000
});

function cache(options: GuildOptions): GuildOptions {
    GUILD_CACHE.set(options.guildId, options);
    return options;
}

export async function createDefaultGuildOptions(guildId: string): Promise<GuildOptions> {
    if (guildId.length !== 18) {
        throw new Error(`Discord guild ID's are expected to be 18 long, was '${guildId}'`);
    }

    try {
        const created = await GuildOptions.create({ guildId });
        return cache(created);
    } catch (err) {
        if (err instanceof UniqueConstraintError) {
            throw new Error(`GuildOptions for Guild with ID '${guildId}' already exists`);
        }
        throw err;
    }
}

export async function getGuildOptions(guildId: string) {
    const cached = GUILD_CACHE.get(guildId);
    if (cached !== undefined) return cached;

    const found = await GuildOptions.findByPk(guildId);
    return found !== null ? cache(found) : null;
}