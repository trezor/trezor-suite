import { act, renderHook } from '@testing-library/react';

import { CORE_CALL, CORE_CALL_CANCEL, POPUP } from '@trezor/connect';
import { WEBEXTENSION_SUITE_WEB_CHANNEL } from '@trezor/connect-common';

import { useConnectPopup } from './useConnectPopup';
import { useConnectPopupWebextension } from './useConnectPopupWebextension';

// The shared popup protocol is not under test: what the webextension link hands to it is.
jest.mock('./useConnectPopup', () => ({ useConnectPopup: jest.fn() }));

// A Chromium extension id: 32 letters from a to p.
const EXTENSION_ID = 'abcdefghijklmnopabcdefghijklmnop';
const OTHER_EXTENSION_ID = 'ponmlkjihgfedcbaponmlkjihgfedcba';

// The channel the extension stamps on every message it sends.
const extensionChannel = {
    here: WEBEXTENSION_SUITE_WEB_CHANNEL.webextension,
    peer: WEBEXTENSION_SUITE_WEB_CHANNEL.suiteWeb,
};

const handshakeRequest = () => ({ type: 'channel-handshake-request', channel: extensionChannel });
const handshake = () => ({
    type: POPUP.HANDSHAKE,
    channel: extensionChannel,
    id: 1,
    payload: { manifest: { appName: 'App' }, version: '1.0.0' },
});
const call = (payload: Record<string, unknown> = { method: 'getFeatures' }, id = 2) => ({
    type: CORE_CALL,
    channel: extensionChannel,
    id,
    payload,
});

// Exactly what the extension's service worker writes to the URL of the tab.
const hashFor = (extensionId: string, message: unknown) =>
    `#extension-id=${extensionId}&message=${encodeURIComponent(JSON.stringify(message))}`;

const useConnectPopupMock = jest.mocked(useConnectPopup);

const getLastCall = () => {
    const { lastCall } = useConnectPopupMock.mock;
    if (!lastCall) throw new Error('The webextension link never called useConnectPopup.');

    return lastCall;
};
// `null` while the link is idle, otherwise the link the shared protocol works with.
const getLink = () => getLastCall()[0];
const getForwarded = () => getLastCall()[1];

const renderWebextensionLink = (hash = '') => {
    window.history.pushState({}, '', `/${hash}`);

    return renderHook(() => useConnectPopupWebextension());
};

// What `chrome.tabs.update` does to the open tab: its hash changes and the page is told so.
const receive = (message: unknown, extensionId = EXTENSION_ID) =>
    act(() => {
        window.history.pushState({}, '', `/${hashFor(extensionId, message)}`);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

describe(useConnectPopupWebextension.name, () => {
    beforeEach(() => {
        useConnectPopupMock.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('stays idle when Suite Web was not opened by an extension', () => {
        renderWebextensionLink();

        expect(getLink()).toBeNull();
        expect(getForwarded()).toEqual([]);
    });

    describe('the id of the extension, which is also the origin of its calls', () => {
        it('is taken from the URL of the tab the extension opened', () => {
            renderWebextensionLink(`#extension-id=${EXTENSION_ID}`);

            expect(getLink()?.origin).toBe(EXTENSION_ID);
        });

        // Only a Chromium extension id can name an extension, and it can never be mistaken for the
        // origin of a website: those hold a scheme, so a caller cannot take another one's grants.
        it.each([
            ['the wildcard', '*'],
            ['null of a sandboxed or local page', 'null'],
            ['a space', ' '],
            ['the origin of a website', 'https://app.example'],
            ['the origin of an extension', `chrome-extension://${EXTENSION_ID}`],
            ['a name that is not an id', 'test-extension-id'],
            ['an id that is too short', EXTENSION_ID.slice(1)],
            ['an id that is too long', `${EXTENSION_ID}a`],
            ['an id in upper case', EXTENSION_ID.toUpperCase()],
            ['an id with a letter after p', `${EXTENSION_ID.slice(1)}q`],
            ['an id with something after it', `${EXTENSION_ID} `],
        ])('is not accepted as %s: the link stays idle', (_, extensionId) => {
            renderWebextensionLink(hashFor(extensionId, handshakeRequest()));

            expect(getLink()).toBeNull();
            expect(getForwarded()).toEqual([]);
        });

        it('is the first one: a later message that claims another one is dropped', () => {
            jest.spyOn(console, 'warn').mockImplementation(() => {});
            renderWebextensionLink(hashFor(EXTENSION_ID, handshakeRequest()));

            receive(call(), OTHER_EXTENSION_ID);

            expect(getLink()?.origin).toBe(EXTENSION_ID);
            expect(getForwarded()).toEqual([
                expect.objectContaining({ type: 'channel-handshake-request' }),
            ]);
        });

        it('is not taken from a message when the tab was opened without one', () => {
            renderWebextensionLink();

            receive(handshakeRequest());

            expect(getLink()).toBeNull();
            expect(getForwarded()).toEqual([]);
        });
    });

    describe('a message in the URL', () => {
        it('is passed on, and removed from the URL so it is not read again', () => {
            renderWebextensionLink(hashFor(EXTENSION_ID, handshakeRequest()));

            expect(getForwarded()).toEqual([
                expect.objectContaining({ type: 'channel-handshake-request' }),
            ]);
            expect(window.location.hash).toBe('');
        });

        // The hash is decoded once by the URL itself, so a second decoding would change what the
        // extension sent: `%41` into `A`, and refuse a lone `%` altogether.
        it.each([
            '%41',
            '100% sure',
            '%',
            '50%25',
            '%E0%A4%A',
            'a+b c&d=e',
            'ünïcode ✓ 😀',
            '"q" \\ /',
        ])('arrives as the extension sent it: %p', text => {
            renderWebextensionLink(hashFor(EXTENSION_ID, handshakeRequest()));

            receive(call({ method: 'signMessage', message: text }));

            expect(getForwarded()).toContainEqual(
                expect.objectContaining({
                    type: CORE_CALL,
                    payload: { method: 'signMessage', message: text },
                }),
            );
        });

        it('is dropped when it is malformed, without failing', () => {
            expect(() =>
                renderWebextensionLink(`#extension-id=${EXTENSION_ID}&message=%7Bnot-json`),
            ).not.toThrow();

            expect(getLink()?.origin).toBe(EXTENSION_ID);
            expect(getForwarded()).toEqual([]);
        });

        it('is passed on once when the extension repeats it', () => {
            renderWebextensionLink(hashFor(EXTENSION_ID, handshakeRequest()));

            receive(call());
            receive(call());

            expect(getForwarded()).toEqual([
                expect.objectContaining({ type: 'channel-handshake-request' }),
                expect.objectContaining({ type: CORE_CALL }),
            ]);
        });

        it.each([
            ['channel-handshake-request', handshakeRequest()],
            ['POPUP.HANDSHAKE', handshake()],
            ['CORE_CALL', call()],
            ['CORE_CALL_CANCEL', { type: CORE_CALL_CANCEL, channel: extensionChannel }],
            ['POPUP.CLOSED', { type: POPUP.CLOSED, channel: extensionChannel }],
        ])('is passed on when it is a %s of the extension', (_, message) => {
            renderWebextensionLink(`#extension-id=${EXTENSION_ID}`);

            receive(message);

            expect(getForwarded()).toEqual([expect.objectContaining({ type: message.type })]);
        });

        // The extension retries its handshake only every 2 seconds, while it answers the
        // POPUP.CORE_LOADED of Suite at once, and the URL loses an update that comes while the
        // tab loads. So the handshake of the popup may well come first: dropping it would leave
        // the call without an answer.
        it('is passed on even before the extension has sent a handshake request', () => {
            renderWebextensionLink(`#extension-id=${EXTENSION_ID}`);

            receive(handshake());
            receive(call());

            expect(getForwarded()).toEqual([
                expect.objectContaining({ type: POPUP.HANDSHAKE }),
                expect.objectContaining({ type: CORE_CALL }),
            ]);
        });

        it.each<[string, unknown]>([
            ['no channel', undefined],
            ['a channel of another sender', { ...extensionChannel, here: '@trezor/other' }],
            ['a channel to another receiver', { ...extensionChannel, peer: '@trezor/other' }],
            [
                'the channel of Suite Web itself',
                { here: extensionChannel.peer, peer: extensionChannel.here },
            ],
            ['a channel with nothing in it', {}],
        ])('is dropped when it has %s', (_, channel) => {
            renderWebextensionLink(`#extension-id=${EXTENSION_ID}`);

            receive({ ...handshakeRequest(), channel });
            receive({ ...handshake(), channel });
            receive({ ...call(), channel });
            receive({ type: CORE_CALL_CANCEL, channel });

            expect(getForwarded()).toEqual([]);
        });

        it('is dropped when the protocol of the popup does not know its type', () => {
            renderWebextensionLink(`#extension-id=${EXTENSION_ID}`);

            receive({ type: 'something-else', channel: extensionChannel });
            receive({ channel: extensionChannel });

            expect(getForwarded()).toEqual([]);
        });

        it.each<[string, unknown]>([
            ['a number', 5],
            ['a string', 'text'],
            ['a list', [call()]],
            ['a boolean', true],
        ])('is dropped when it is %s and not a message', (_, value) => {
            renderWebextensionLink(`#extension-id=${EXTENSION_ID}`);

            receive(value);

            expect(getForwarded()).toEqual([]);
        });
    });
});
