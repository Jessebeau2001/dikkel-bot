type Writer<T> = (items: T[]) => void | Promise<void>

interface BufferOptions<T> {
  maxBatchSize?: number;
  flushIntervalMs?: number;
  writer: Writer<T>;
}

class BufferedWriter<T> {
    private _buffer: T[] = [];
    private _maxBatchSize: number;
    private _writer: Writer<T>;
    
    private _timer?: NodeJS.Timeout;
    private _isWriting = false;
    private _isWriteScheduled = false;

    constructor({
        maxBatchSize = 50,
        flushIntervalMs,
        writer: writer,
    }: BufferOptions<T>) {
        this._maxBatchSize = maxBatchSize;
        this._writer = writer;

        if (flushIntervalMs !== undefined && flushIntervalMs > 0) {
            this._timer = setInterval(
                () => this.scheduleWrite(),
                flushIntervalMs
            );
        }
    }

    private checkAndWrite() {
        if (this._maxBatchSize > 0 && this._buffer.length >= this._maxBatchSize) {
            this.scheduleWrite();
        }
    }

    private scheduleWrite() {
        if (this._isWriteScheduled) return;
        this._isWriteScheduled = true;

        setImmediate(() => this.write());
    }

    private async write() {
        if (this._isWriting) return;
        if (this._buffer.length === 0) {
            this._isWriteScheduled = false;
            return;
        }

        this._isWriting = true;
        this._isWriteScheduled = false;

        const batch = this._buffer;
        this._buffer = [];
        
        try {
            await this._writer?.(batch);
            // TODO: What to do on actual error
        } finally {
            this._isWriting = false;
        }

        // If new items arrived during flush, flush again
        if (this._buffer.length > 0) {
            this.scheduleWrite();
        }
    }

    push(value: T) {
        this._buffer.push(value);
        this.checkAndWrite();
    }

    async shutdown() {
        if (this._timer) clearInterval(this._timer);
        await this.write();
    }
}

export default BufferedWriter;