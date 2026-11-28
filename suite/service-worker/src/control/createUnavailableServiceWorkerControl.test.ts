import { ok } from '@trezor/type-utils';

import { createUnavailableServiceWorkerControl } from './createUnavailableServiceWorkerControl';

describe(createUnavailableServiceWorkerControl.name, () => {
    it('reports service workers as unavailable and treats the switched-off state as reconciled', async () => {
        const serviceWorkerControl = createUnavailableServiceWorkerControl();

        expect(serviceWorkerControl.isSupported()).toBe(false);
        expect(
            await serviceWorkerControl.reconcile({ isEnabled: false, isDevLogsEnabled: false }),
        ).toEqual(ok());
        expect(
            (await serviceWorkerControl.reconcile({ isEnabled: true, isDevLogsEnabled: false }))
                .success,
        ).toBe(false);
        expect(await serviceWorkerControl.getStatus()).toEqual(ok(null));
        expect(serviceWorkerControl.listenForReloadRequests()).toEqual(expect.any(Function));
        expect(serviceWorkerControl.listenForCacheUpdates(() => {})).toEqual(expect.any(Function));
        expect(serviceWorkerControl.watchForUpdates(() => {})).toEqual(expect.any(Function));
        expect(serviceWorkerControl.listenForTakeover(() => {})).toEqual(expect.any(Function));
    });
});
