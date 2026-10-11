import { createPopupCallDeferred, queuePopupCall } from './connectPopupPromiseManager';

const response = { success: true, payload: {} } as const;

const flush = async () => {
    for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
};

describe('queuePopupCall', () => {
    it('starts queued calls one at a time', async () => {
        const first = await queuePopupCall();
        const started: string[] = [];
        const second = queuePopupCall().then(deferred => {
            started.push('second');

            return deferred;
        });
        const third = queuePopupCall().then(deferred => {
            started.push('third');

            return deferred;
        });

        first.resolve(response);
        await flush();
        expect(started).toEqual(['second']);

        (await second).resolve(response);
        await flush();
        expect(started).toEqual(['second', 'third']);

        (await third).resolve(response);
    });

    it('keeps queued calls waiting for the latest call after an earlier call settles', async () => {
        const earlier = createPopupCallDeferred();
        const latest = createPopupCallDeferred();
        earlier.resolve(response);
        await flush();

        let started = false;
        const queued = queuePopupCall().then(deferred => {
            started = true;

            return deferred;
        });
        await flush();
        expect(started).toBe(false);

        latest.resolve(response);
        (await queued).resolve(response);
        expect(started).toBe(true);
    });

    it('keeps queued calls waiting for an earlier call after a later unqueued call settles', async () => {
        // A WalletConnect/deeplink call starts without queuing while a queued call is in flight.
        const earlier = await queuePopupCall();
        const unqueued = createPopupCallDeferred();

        let started = false;
        const queued = queuePopupCall().then(deferred => {
            started = true;

            return deferred;
        });
        unqueued.resolve(response);
        await flush();
        expect(started).toBe(false);

        earlier.resolve(response);
        (await queued).resolve(response);
        expect(started).toBe(true);
    });
});
