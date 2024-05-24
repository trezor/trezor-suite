export class Throttler {
    private readonly delay: number;
    private readonly intervals: { [id: string]: ReturnType<typeof setInterval> };
    private readonly callbacks: { [id: string]: () => void };

    constructor(delay: number) {
        this.delay = delay;
        this.intervals = {};
        this.callbacks = {};
    }

    throttle(id: string, callback: () => void) {
        if (this.intervals[id]) {
            this.callbacks[id] = callback;
        } else {
            callback();
            this.intervals[id] = setInterval(() => this.tick(id), this.delay);
        }
    }

    private tick(id: string) {
        if (this.callbacks[id]) {
            this.callbacks[id]();
            delete this.callbacks[id];
        } else {
            this.cancel(id);
        }
    }

    cancel(id: string) {
        clearInterval(this.intervals[id]);
        delete this.intervals[id];
        delete this.callbacks[id];
    }

    dispose() {
        Object.keys(this.intervals).forEach(this.cancel, this);
    }
}
