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

    // Documents the bug: every manager looks the iframe up by the fixed DOM id
    // `trezor-connect-bootstrap`, so the second one adopts the element of the
    // first instead of appending its own. The adopted `src` carries the
    // `connect-popup-req` channel id of whoever created it, so the second
    // manager's bootstrap handshake can never complete.
    it('shares one iframe between instances', async () => {
        const first = getIframeInstance();
        const second = getIframeInstance();
        await createAndLoad(first);
        await createAndLoad(second);
        expect(getElement(second)).toBe(getElement(first));
    });

    // Documents the bug: the same lookup adopts any element that carries the
    // fixed id, e.g. one left behind by a previous bundle on the page.
    it('adopts a foreign iframe left in the document', async () => {
        const foreign = document.createElement('iframe');
        foreign.id = 'trezor-connect-bootstrap';
        document.body.appendChild(foreign);

        const iframe = getIframeInstance();
        await createAndLoad(iframe);
        expect(getElement(iframe)).toBe(foreign);
    });
});
