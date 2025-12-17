type CacheEntry<V> = {
  value: V;
  expiresAt: number;
};

export default class SimpleLRUCache<K, V> {
    private _cache = new Map<K, CacheEntry<V>>();
    private _max: number; // Max number of cached elements
    private _ttl: number; // Lifetime in ms

    constructor({ max = 1000, ttlMs = 60_000 } = {}) {
        this._max = max;
        this._ttl = ttlMs;
    }

    private isExpired(entry: CacheEntry<V>): boolean {
        return entry.expiresAt <= now();
    }

    private createEntry(value: V): CacheEntry<V> {
        return {
            value,
            expiresAt: now() + this._ttl,
        };
    }

    // Sets the entry while making sure that the key is the new head in the linked keyset
    private setHead(key: K, value: CacheEntry<V>): void {
        // By deleting the original entry instead of overwriting we pull the key to the front
        this._cache.delete(key);
        this._cache.set(key, value);
    }

    get(key: K): V | undefined {
        const entry = this._cache.get(key);
        if (!entry) return undefined;

        if (this.isExpired(entry)) {
            this._cache.delete(key);
            return undefined;
        }

        this.setHead(key, entry);
        return entry.value;
    }

    set(key: K, value: V) {
        const entry = this.createEntry(value);

        this.setHead(key, entry);

        // Evict LRU if over capacity
        if (this.size > this._max) {
            const lruKey = this._cache.keys().next().value!;
            this._cache.delete(lruKey);
        }
    }

    delete(key: K): boolean {
        return this._cache.delete(key);
    }

    clear() {
        this._cache.clear();
    }

    get size(): number {
        return this._cache.size;
    }
}

function now(): number {
    return Date.now();
}