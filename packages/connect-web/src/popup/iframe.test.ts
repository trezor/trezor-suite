/**
 * @jest-environment jsdom
 */

import { getIframeInstance } from './iframe';

const IFRAME_ID = 'trezor-connect-bootstrap';
const SRC = 'https://suite.trezor.io/connect-popup/bootstrap.html';

jest.useFakeTimers();

// Fully mock the DOM iframe handling so we never create a real jsdom browsing
// context (whose teardown breaks on a stubbed contentWindow). `registry` mirrors
// what the manager appends/removes, keyed by element id.
let registry: Record<string, any> = {};
let created: any[] = [];

const makeFakeIframe = () => {
    const el: any = {
        id: '',
        frameBorder: '',
        width: '',
        height: '',
        style: {},
        onload: null,
        setAttribute: jest.fn((key: string, value: string) => {
            el[key] = value;
        }),
        contentWindow: { location: { origin: 'https://suite.trezor.io' } },
        parentNode: null,
        remove: jest.fn(() => {
            if (el.id) delete registry[el.id];
            el.parentNode = null;
        }),
    };
    created.push(el);

    return el;
};

const origCreateElement = document.createElement.bind(document);

beforeEach(() => {
    registry = {};
    created = [];
    jest.clearAllTimers();

    jest.spyOn(document, 'createElement').mockImplementation((tag: string) =>
        tag === 'iframe' ? makeFakeIframe() : origCreateElement(tag),
    );
    jest.spyOn(document, 'getElementById').mockImplementation((id: string) => registry[id] ?? null);
    jest.spyOn(document.body, 'appendChild').mockImplementation((el: any) => {
        el.parentNode = {
            removeChild: (child: any) => {
                if (child.id) delete registry[child.id];
                child.parentNode = null;
            },
        };
        if (el.id) registry[el.id] = el;

        return el;
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

const currentEl = () => registry[IFRAME_ID] ?? null;

// Drive the appended iframe's onload; contentWindow reports a valid cross-origin
// location, which is what makes handleIframeLoad resolve the init promise.
const fireLoad = () => {
    const el = currentEl();
    if (!el) throw new Error('iframe element not appended');
    el.onload?.(new Event('load'));
};

const createAndLoad = async (iframe: ReturnType<typeof getIframeInstance>) => {
    const promise = iframe.create(SRC);
    fireLoad();
    await promise;
};

describe('getIframeInstance', () => {
    it('resolves create() once the iframe finishes loading', async () => {
        const iframe = getIframeInstance();
        const promise = iframe.create(SRC);
        expect(currentEl()).not.toBeNull();

        fireLoad();
        await expect(promise).resolves.toBeUndefined();
    });

    it('reuses the existing iframe on a subsequent create()', async () => {
        const iframe = getIframeInstance();
        await createAndLoad(iframe);
        expect(created).toHaveLength(1);

        await iframe.create(SRC);
        expect(created).toHaveLength(1);
    });

    // Regression: a failure that happens AFTER the iframe has loaded (e.g. the
    // bootstrap handshake timing out) never rejects create(), so the manager
    // keeps a resolved initPromise and a live iframe. destroy() must let the
    // next create() rebuild a fresh iframe, mirroring a page reload.
    it('destroy() tears the loaded iframe down so create() rebuilds a fresh one', async () => {
        const iframe = getIframeInstance();
        await createAndLoad(iframe);

        const first = currentEl();
        expect(first).not.toBeNull();

        iframe.destroy();
        expect(currentEl()).toBeNull();
        expect(first.remove).toHaveBeenCalled();

        const promise = iframe.create(SRC);
        const second = currentEl();
        expect(second).not.toBeNull();
        expect(second).not.toBe(first);
        expect(created).toHaveLength(2);

        fireLoad();
        await expect(promise).resolves.toBeUndefined();
    });

    // Guard for the original PR #29770 fix: a load timeout must clear the
    // rejected initPromise so the next create() starts fresh.
    it('clears the rejected init promise on load timeout (#29770)', async () => {
        const iframe = getIframeInstance();
        const settled = iframe.create(SRC).catch(error => error);
        expect(currentEl()).not.toBeNull();

        jest.advanceTimersByTime(10000);
        const error = await settled;
        expect(error).toBeDefined();
        expect(currentEl()).toBeNull();

        const promise = iframe.create(SRC);
        expect(currentEl()).not.toBeNull();
        expect(created).toHaveLength(2);

        fireLoad();
        await expect(promise).resolves.toBeUndefined();
    });
});
