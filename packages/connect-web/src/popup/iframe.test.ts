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

    it('destroy() rejects a load still in flight so create() settles', async () => {
        const iframe = getIframeInstance();
        const settled = iframe.create(SRC).catch(error => error);
        expect(iframe.get()).toBeDefined();

        iframe.destroy();
        await expect(settled).resolves.toMatchObject({ message: 'iframe-destroyed' });
        expect(iframe.get()).toBeUndefined();

        const promise = iframe.create(SRC);
        fireLoad(iframe);
        await expect(promise).resolves.toBeUndefined();
    });

    // Regression: the first attempt's rejection reactions run as microtasks, so
    // a create() issued synchronously after destroy() has already armed its own
    // load timeout by the time they run. Clearing the shared timeout without
    // checking whose it is left the second attempt without a timeout.
    it('keeps the load timeout of a create() issued right after destroy()', async () => {
        const iframe = getIframeInstance();
        const first = iframe.create(SRC).catch(error => error);
        iframe.destroy();
        const second = iframe.create(SRC).catch(error => error);

        await expect(first).resolves.toMatchObject({ message: 'iframe-destroyed' });

        jest.advanceTimersByTime(10000);
        await expect(second).resolves.toMatchObject({ message: 'iframe-timeout' });
        expect(iframe.get()).toBeUndefined();
    });

    it('gives each instance its own iframe', async () => {
        const first = getIframeInstance();
        const second = getIframeInstance();
        await createAndLoad(first);
        await createAndLoad(second);
        expect(getElement(second)).not.toBe(getElement(first));

        second.destroy();
        expect(second.get()).toBeUndefined();
        expect(getElement(first).isConnected).toBe(true);
    });

    it('does not adopt a foreign iframe left in the document', async () => {
        const foreign = document.createElement('iframe');
        foreign.id = 'trezor-connect-bootstrap';
        document.body.appendChild(foreign);

        const iframe = getIframeInstance();
        await createAndLoad(iframe);
        expect(getElement(iframe)).not.toBe(foreign);

        iframe.destroy();
        expect(foreign.isConnected).toBe(true);
    });
});
