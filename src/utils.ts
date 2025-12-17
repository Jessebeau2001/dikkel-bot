
export function getRandomValue<T>(array: T[]): T {
    if (array === undefined || array.length === 0) {
        throw new Error('Cannot get random in empty array');
    };
    const index = Math.floor(Math.random() * array.length);
    return array[index]!;
}

export function getEnvNumber(key: string): number {
    const value = getEnvString(key);
    const number = Number(value);
    if (!isNaN(number)) {
        return number;
    } else {
        // Don't be smart and print the original value back to the console
        throw new Error(`Environment variable ${key} is required to be a number`);
    }
}

export function getEnvString(key: string): string {
    const value = process.env[key];
    if (value !== undefined) {
        return value;
    } else {
        throw new Error(`Environment variable ${key} is was not found but is required`);
    }
}

export function getOrDefaultEnv<T extends string | number | boolean>(
    key: string,
    fallback: T
): T {
    const raw = process.env[key];

    if (raw === undefined) {
        console.log(`Env ${key} was omitted, defaulting to value '${fallback}'`);
        return fallback;
    }

    if (typeof fallback === 'number') {
        const parsed = Number(raw);
        if (isNaN(parsed)) {
            console.warn(`Env ${key}='${raw}' is not a valid number. Defaulting to value ${fallback}`);
            return fallback;
        }
        return parsed as T;
    }

    if (typeof fallback === 'boolean') {
        const lower = raw.toLowerCase();
        if (lower === 'true') return true as T;
        if (lower === 'false') return false as T;
        console.warn(`Env ${key}='${raw}' is not a valid boolean. Defaulting to value ${fallback}`);
        return fallback;
    }

    // String is default case
    return raw as T;
}
