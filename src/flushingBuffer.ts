type FlushCallback<T> = (items: T[]) => void | Promise<void>

interface BufferOptions<T> {
  maxBatchSize?: number;
  flushIntervalMs?: number;
  flush: FlushCallback<T>;
}

class FlushingBuffer<T> {
    private _buffer: T[] = [];
    private _maxBatchSize: number;
    private _flush: FlushCallback<T>;
    
    private _timer?: NodeJS.Timeout;
    private _isFlushing = false;
    private _isFlushScheduled = false;

    constructor({
        maxBatchSize = 50,
        flushIntervalMs,
        flush,
    }: BufferOptions<T>) {
        this._maxBatchSize = maxBatchSize;
        this._flush = flush;

        if (flushIntervalMs !== undefined && flushIntervalMs > 0) {
            this._timer = setInterval(
                () => this.scheduleFlush(),
                flushIntervalMs
            );
        }
    }

    private checkAndFlush() {
        if (this._maxBatchSize > 0 && this._buffer.length >= this._maxBatchSize) {
            this.scheduleFlush();
        }
    }

    private scheduleFlush() {
        if (this._isFlushScheduled) return;
        this._isFlushScheduled = true;

        setImmediate(() => this.flush());
    }

    private async flush() {
        if (this._isFlushing) return;
        if (this._buffer.length === 0) {
            this._isFlushScheduled = false;
            return;
        }

        this._isFlushing = true;
        this._isFlushScheduled = false;

        const batch = this._buffer;
        this._buffer = [];
        
        try {
            await this._flush?.(batch);
            // TODO: What to do on actual error
        } finally {
            this._isFlushing = false;
        }

        // If new items arrived during flush, flush again
        if (this._buffer.length > 0) {
            this.scheduleFlush();
        }
    }

    push(value: T) {
        this._buffer.push(value);
        this.checkAndFlush();
    }

    async shutdown() {
        if (this._timer) clearInterval(this._timer);
        await this.flush();
    }
}

export default FlushingBuffer;