type Waiter<T> = (value: IteratorResult<T>) => void;

// A push-based queue with async pull. push() delivers to the next waiter or buffers;
// pull() returns the next buffered value or waits for the next push. close() drains
// remaining waiters with done=true.
export class EventChannel<T> {
    private buffer: T[] = [];
    private waiters: Waiter<T>[] = [];
    private closed = false;

    push(value: T) {
        if (this.closed) return;
        const waiter = this.waiters.shift();
        if (waiter) {
            waiter({ value, done: false });
        } else {
            this.buffer.push(value);
        }
    }

    pull(): Promise<IteratorResult<T>> {
        if (this.buffer.length > 0) {
            return Promise.resolve({ value: this.buffer.shift() as T, done: false });
        }
        if (this.closed) {
            return Promise.resolve({ value: undefined as unknown as T, done: true });
        }

        return new Promise<IteratorResult<T>>(resolve => {
            this.waiters.push(resolve);
        });
    }

    close() {
        if (this.closed) return;
        this.closed = true;
        const pending = this.waiters;
        this.waiters = [];
        pending.forEach(w => w({ value: undefined as unknown as T, done: true }));
    }
}
