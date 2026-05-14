import { type IntervalId } from '@trezor/type-utils';

type PollingCallback = () => Promise<void> | void;

export class PollingController {
    private intervalId: IntervalId | null = null;
    private running = false;

    start(callback: PollingCallback, intervalMs: number) {
        if (this.intervalId) return;

        this.intervalId = setInterval(async () => {
            if (this.running) return;
            this.running = true;
            try {
                await callback();
            } catch (error: unknown) {
                console.error(error);
            } finally {
                this.running = false;
            }
        }, intervalMs);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async restart(callback: PollingCallback, intervalMs: number) {
        this.stop();
        try {
            await callback();
        } catch (error: unknown) {
            console.error(error);
        }
        this.start(callback, intervalMs);
    }

    isScheduled() {
        return this.intervalId !== null;
    }
}
