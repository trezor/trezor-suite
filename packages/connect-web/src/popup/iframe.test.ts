/**
 * @jest-environment jsdom
 */

import { getIframeInstance } from './iframe';

const SRC = 'https://suite.trezor.io/connect-popup/bootstrap.html';

type Iframe = ReturnType<typeof getIframeInstance>;

jest.useFakeTimers();

beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllTimers();
});

const getElement = (iframe: Iframe) => {
    const element = iframe.get();
    if (!element) throw new Error('iframe element not appended');

    return element;
};

// jsdom never fetches the iframe document, so the load event is dispatched by
// hand. contentWindow still reports the origin of `src`, which is what
// handleIframeLoad checks before resolving.
const fireLoad = (iframe: Iframe) => {
    getElement(iframe).dispatchEvent(new Event('load'));
};

const createAndLoad = async (iframe: Iframe) => {
    const promise = iframe.create(SRC);
    fireLoad(iframe);
    await promise;
};

describe('getIframeInstance', () => {
    it('resolves create() once the iframe finishes loading', async () => {
        const iframe = getIframeInstance();
        const promise = iframe.create(SRC);
        expect(iframe.get()).toBeDefined();

        fireLoad(iframe);
        await expect(promise).resolves.toBeUndefined();
    });

    it('reuses the existing iframe on a subsequent create()', async () => {
        const iframe = getIframeInstance();
        await createAndLoad(iframe);
        const first = getElement(iframe);

        await iframe.create(SRC);
        expect(iframe.get()).toBe(first);
    });

    // Regression: a failure that happens AFTER the iframe has loaded (e.g. the
    // bootstrap handshake timing out) never rejects create(), so the manager
    // keeps a resolved initPromise and a live iframe. destroy() must let the
    // next create() rebuild a fresh iframe, mirroring a page reload.
    it('destroy() tears the loaded iframe down so create() rebuilds a fresh one', async () => {
        const iframe = getIframeInstance();
        await createAndLoad(iframe);
        const first = getElement(iframe);

        iframe.destroy();
        expect(iframe.get()).toBeUndefined();
        expect(first.isConnected).toBe(false);

        const promise = iframe.create(SRC);
        expect(getElement(iframe)).not.toBe(first);

        fireLoad(iframe);
        await expect(promise).resolves.toBeUndefined();
    });

    // Guard for the original PR #29770 fix: a load timeout must clear the
    // rejected initPromise so the next create() starts fresh.
    it('clears the rejected init promise on load timeout (#29770)', async () => {
        const iframe = getIframeInstance();
        const settled = iframe.create(SRC).catch(error => error);
        const first = getElement(iframe);

        jest.advanceTimersByTime(10000);
        await expect(settled).resolves.toMatchObject({ message: 'iframe-timeout' });
        expect(iframe.get()).toBeUndefined();

        const promise = iframe.create(SRC);
        expect(getElement(iframe)).not.toBe(first);

        fireLoad(iframe);
        await expect(promise).resolves.toBeUndefined();
    });
});
