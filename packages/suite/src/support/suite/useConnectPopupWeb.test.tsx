import { type PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react';

import { connectPopupActions } from '@suite-common/connect-popup';
import { CORE_CALL, CORE_CALL_CANCEL, POPUP } from '@trezor/connect';
import { ServicesProvider } from '@trezor/dependency-injection';
import { type DispatchDep } from '@trezor/redux-utils';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import { useConnectPopup } from './useConnectPopup';
import { useConnectPopupWeb } from './useConnectPopupWeb';

// The shared popup protocol is not under test: what the web link hands to it is.
jest.mock('./useConnectPopup', () => ({ useConnectPopup: jest.fn() }));

// Delivers a message to every other open channel of the same name, as a browser does.
class FakeBroadcastChannel {
    static channels: FakeBroadcastChannel[] = [];

    private listeners = new Set<(event: MessageEvent) => void>();
    private isClosed = false;

    constructor(readonly name: string) {
        FakeBroadcastChannel.channels.push(this);
    }

    postMessage(data: unknown) {
        FakeBroadcastChannel.channels
            .filter(channel => channel !== this && channel.name === this.name && !channel.isClosed)
            .forEach(channel =>
                channel.listeners.forEach(listener =>
                    listener(new MessageEvent('message', { data })),
                ),
            );
    }

    addEventListener(_type: string, listener: (event: MessageEvent) => void) {
        this.listeners.add(listener);
    }

    removeEventListener(_type: string, listener: (event: MessageEvent) => void) {
        this.listeners.delete(listener);
    }

    close() {
        this.isClosed = true;
    }
}

const REQUEST_ID = 'request-1';
const CALLER_ORIGIN = 'https://app.example';
const OTHER_ORIGIN = 'https://other.example';
const HANDSHAKE_TIMEOUT = 3000;
const ORIGIN_MISSING_ACTION = connectPopupActions.setError({
    code: 'Handshake_Error',
    message: 'origin-missing',
});
const HANDSHAKE_TIMEOUT_ACTION = connectPopupActions.setError({
    code: 'Handshake_Error',
    message: 'handshake-timeout',
});

// What the bootstrap iframe forwards from the caller's connect-web: it keeps a message only when
// its channel is this one, and stamps the origin it verified on it.
const callerChannel = { here: '@trezor/connect-web', peer: '@trezor/connect-popup' };

const handshakeRequest = (origin: unknown) => ({
    type: 'channel-handshake-request',
    channel: callerChannel,
    origin,
});
const handshake = (origin: unknown) => ({
    type: POPUP.HANDSHAKE,
    channel: callerChannel,
    origin,
    id: 1,
    payload: { manifest: { appName: 'App' }, version: '1.0.0' },
});
const call = (origin: unknown) => ({
    type: CORE_CALL,
    channel: callerChannel,
    origin,
    id: 2,
    payload: { method: 'getFeatures' },
});

const useConnectPopupMock = jest.mocked(useConnectPopup);

const getLastCall = () => {
    const { lastCall } = useConnectPopupMock.mock;
    if (!lastCall) throw new Error('The web link never called useConnectPopup.');

    return lastCall;
};
// `null` while there is no channel to the caller, otherwise the link the shared protocol works with.
const getLinkOrigin = () => getLastCall()[0]?.origin;
const getForwardedTypes = () => getLastCall()[1].map(message => message.type);

const renderWebLink = (url = `/?connect-popup-req=${REQUEST_ID}`) => {
    window.history.pushState({}, '', url);

    const { actions, dispatch } = createMockDispatch({ getState: () => ({}) });
    const services: { store: DispatchDep } = { store: { dispatch } };
    const view = renderHook(() => useConnectPopupWeb(), {
        wrapper: ({ children }: PropsWithChildren) => (
            <ServicesProvider services={services}>{children}</ServicesProvider>
        ),
    });

    // The other end of the channel, which is where the caller's messages come from.
    const bootstrap = new FakeBroadcastChannel(`@trezor/connect-popup/${REQUEST_ID}`);
    const receive = (message: unknown) => act(() => bootstrap.postMessage(message));

    return { ...view, actions, bootstrap, receive };
};

describe(useConnectPopupWeb.name, () => {
    beforeAll(() => {
        Object.defineProperty(window, 'BroadcastChannel', {
            value: FakeBroadcastChannel,
            configurable: true,
            writable: true,
        });
    });

    beforeEach(() => {
        jest.useFakeTimers();
        useConnectPopupMock.mockReset();
        FakeBroadcastChannel.channels = [];
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('the origin of the caller', () => {
        it('is not known until the caller has been identified', () => {
            renderWebLink();

            expect(getLinkOrigin()).toBe('*');
        });

        it('is the origin the bootstrap verified for it, and the handshake is passed on', () => {
            const { receive } = renderWebLink();

            receive(handshakeRequest(CALLER_ORIGIN));

            expect(getLinkOrigin()).toBe(CALLER_ORIGIN);
            expect(getForwardedTypes()).toEqual(['channel-handshake-request']);
        });

        it('stays the first one, however often the same caller repeats its handshake', () => {
            const { receive } = renderWebLink();

            receive(handshakeRequest(CALLER_ORIGIN));
            receive(handshakeRequest(CALLER_ORIGIN));

            expect(getLinkOrigin()).toBe(CALLER_ORIGIN);
            expect(getForwardedTypes()).toEqual([
                'channel-handshake-request',
                'channel-handshake-request',
            ]);
        });

        it('stays the first one when a handshake claims another origin later', () => {
            const { receive, actions } = renderWebLink();
            receive(handshakeRequest(CALLER_ORIGIN));

            receive(handshakeRequest(OTHER_ORIGIN));

            expect(getLinkOrigin()).toBe(CALLER_ORIGIN);
            expect(getForwardedTypes()).toEqual(['channel-handshake-request']);
            expect(actions).toEqual([]);
        });
    });

    describe('a handshake without an established origin', () => {
        it.each<[string, unknown]>([
            ['the wildcard', '*'],
            ['an empty string', ''],
            ['null of a sandboxed or local page', 'null'],
            ['a padded origin', ` ${CALLER_ORIGIN}`],
            ['a wildcard inside an origin', 'https://*.example.com'],
            ['a scheme with no host', 'myapp://'],
            ['an undefined origin', undefined],
            ['an origin that is not a string', 42],
        ])(
            'does not identify the caller by %s, nor is it passed on to be confirmed',
            (_, origin) => {
                const { receive } = renderWebLink();

                receive(handshakeRequest(origin));

                expect(getLinkOrigin()).toBe('*');
                expect(getForwardedTypes()).toEqual([]);
            },
        );

        it('does not identify the caller by a handshake without the origin at all', () => {
            const { receive } = renderWebLink();

            receive({ type: 'channel-handshake-request', channel: callerChannel });

            expect(getLinkOrigin()).toBe('*');
            expect(getForwardedTypes()).toEqual([]);
        });

        it('shows why, instead of leaving the caller to a timeout', () => {
            const { receive, actions } = renderWebLink();

            receive(handshakeRequest('*'));
            act(() => {
                jest.advanceTimersByTime(HANDSHAKE_TIMEOUT * 2);
            });

            expect(actions).toEqual([ORIGIN_MISSING_ACTION]);
        });

        it('can still be followed by the handshake of the caller', () => {
            const { receive } = renderWebLink();
            receive(handshakeRequest('*'));

            receive(handshakeRequest(CALLER_ORIGIN));

            expect(getLinkOrigin()).toBe(CALLER_ORIGIN);
            expect(getForwardedTypes()).toEqual(['channel-handshake-request']);
        });

        // The call in progress must not be replaced by an error about a message that is not its own.
        it('is ignored quietly once the caller has been identified', () => {
            const { receive, actions } = renderWebLink();
            receive(handshakeRequest(CALLER_ORIGIN));

            receive(handshakeRequest('*'));

            expect(getLinkOrigin()).toBe(CALLER_ORIGIN);
            expect(getForwardedTypes()).toEqual(['channel-handshake-request']);
            expect(actions).toEqual([]);
        });
    });

    describe('a message that starts a call', () => {
        const startsCall = [
            ['the POPUP.HANDSHAKE', handshake],
            ['the CORE_CALL', call],
        ] as const;

        it.each(startsCall)(
            'is not passed on before the caller has been identified: %s',
            (_, createMessage) => {
                const { receive } = renderWebLink();

                receive(createMessage(CALLER_ORIGIN));

                expect(getForwardedTypes()).toEqual([]);
            },
        );

        it('is passed on from the caller that has been identified', () => {
            const { receive } = renderWebLink();

            receive(handshakeRequest(CALLER_ORIGIN));
            receive(handshake(CALLER_ORIGIN));
            receive(call(CALLER_ORIGIN));

            expect(getForwardedTypes()).toEqual([
                'channel-handshake-request',
                POPUP.HANDSHAKE,
                CORE_CALL,
            ]);
        });

        it.each(startsCall)(
            'is not passed on when it was not verified to come from the identified caller: %s',
            (_, createMessage) => {
                const { receive } = renderWebLink();
                receive(handshakeRequest(CALLER_ORIGIN));

                receive(createMessage(OTHER_ORIGIN));
                receive(createMessage('*'));
                receive(createMessage(undefined));

                expect(getForwardedTypes()).toEqual(['channel-handshake-request']);
            },
        );

        it.each(startsCall)(
            'is not passed on after a handshake without an established origin: %s',
            (_, createMessage) => {
                const { receive } = renderWebLink();
                receive(handshakeRequest('*'));

                receive(createMessage('*'));

                expect(getForwardedTypes()).toEqual([]);
            },
        );
    });

    // Withdrawing a call grants nothing, so it does not wait for the caller to be identified.
    it.each([
        ['CORE_CALL_CANCEL', { type: CORE_CALL_CANCEL, channel: callerChannel }],
        ['POPUP.CLOSED', { type: POPUP.CLOSED, channel: callerChannel }],
    ])('passes on %s before the caller has been identified', (_, message) => {
        const { receive } = renderWebLink();

        receive(message);

        expect(getForwardedTypes()).toEqual([message.type]);
    });

    describe('a message that connect-web did not send to the popup', () => {
        it.each<[string, unknown]>([
            ['no channel', undefined],
            [
                'a channel of another sender',
                { here: '@trezor/connect-core', peer: callerChannel.peer },
            ],
            ['a channel to another receiver', { here: callerChannel.here, peer: '@trezor/other' }],
            [
                'the channel of the popup itself',
                { here: callerChannel.peer, peer: callerChannel.here },
            ],
            ['a channel with nothing in it', {}],
        ])('is ignored when it has %s', (_, channel) => {
            const { receive, actions } = renderWebLink();

            expect(() => {
                receive({ ...handshakeRequest(CALLER_ORIGIN), channel });
                receive({ ...handshake(CALLER_ORIGIN), channel });
                receive({ ...call(CALLER_ORIGIN), channel });
                receive({ type: CORE_CALL_CANCEL, channel });
            }).not.toThrow();

            expect(getLinkOrigin()).toBe('*');
            expect(getForwardedTypes()).toEqual([]);
            expect(actions).toEqual([]);
        });

        it('is ignored when it has no type', () => {
            const { receive } = renderWebLink();

            receive({ channel: callerChannel, origin: CALLER_ORIGIN });

            expect(getLinkOrigin()).toBe('*');
            expect(getForwardedTypes()).toEqual([]);
        });
    });

    it('closes itself for a handshake of another popup, which takes over the call', () => {
        const close = jest.spyOn(window, 'close').mockImplementation(() => {});
        const { receive } = renderWebLink();

        receive({
            type: 'channel-handshake-request',
            channel: {
                here: '@trezor/connect-bootstrap-iframe',
                peer: '@trezor/connect-bootstrap-popup',
            },
        });

        expect(close).toHaveBeenCalledTimes(1);
        expect(getForwardedTypes()).toEqual([]);
    });

    describe('the handshake timeout', () => {
        it('reports a handshake that did not come in time', () => {
            const { actions } = renderWebLink();

            act(() => {
                jest.advanceTimersByTime(HANDSHAKE_TIMEOUT);
            });

            expect(actions).toEqual([HANDSHAKE_TIMEOUT_ACTION]);
            expect(getLastCall()[0]).toBeNull();
        });

        it('does not report a caller that was identified in time', () => {
            const { receive, actions } = renderWebLink();
            receive(handshakeRequest(CALLER_ORIGIN));

            act(() => {
                jest.advanceTimersByTime(HANDSHAKE_TIMEOUT * 2);
            });

            expect(actions).toEqual([]);
        });
    });

    it('stays idle when the popup was opened without the request id of a caller', () => {
        const { actions, bootstrap } = renderWebLink('/');

        expect(getLinkOrigin()).toBeUndefined();
        expect(getLastCall()[0]).toBeNull();
        // No channel was opened: the only one is the caller's end of it, which the test made.
        expect(FakeBroadcastChannel.channels).toEqual([bootstrap]);
        expect(actions).toEqual([]);
    });
});
