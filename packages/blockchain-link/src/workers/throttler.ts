export class Throttler {
    private delay: number;
    private timeouts: { [id: string]: ReturnType<typeof setTimeout> };

    constructor(delay: number) {
        this.delay = delay;
        this.timeouts = {};
    }

    throttle(id: string, callback: () => void) {
        const previousTimeout = this.timeouts[id];
        if (previousTimeout) {
            clearTimeout(previousTimeout);
        }
        this.timeouts[id] = setTimeout(() => {
            callback();
            this.cancel(id);
        }, this.delay);
    }

    cancel(id: string) {
        clearTimeout(this.timeouts[id]);
        delete this.timeouts[id];
    }

    dispose() {
        Object.keys(this.timeouts).forEach(this.cancel, this);
    }
}
