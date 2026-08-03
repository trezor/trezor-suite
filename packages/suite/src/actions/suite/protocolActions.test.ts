import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { mockLockDevice } from '@suite-common/device/mocks';
import { type FindNetworkSymbolForProtocol } from '@suite-common/networks';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import * as protocolConstants from './constants/protocolConstants';
import * as protocolActions from './protocolActions';
import {
    type HandleProtocolRequestDispatchDeps,
    type HandleProtocolRequestThunkState,
} from './protocolActions';

jest.mock('@suite-common/walletconnect', () => ({
    walletConnectPairThunk: jest.fn(),
}));

const findNetworkSymbolForProtocol: FindNetworkSymbolForProtocol = protocol =>
    protocol === 'bitcoin' ? asNetworkSymbol('btc') : null;

const createHandleProtocolRequestDeps = () => {
    const getState = (): HandleProtocolRequestThunkState => {
        throw new Error('This thunk must not read state in this test.');
    };
    const extra: HandleProtocolRequestDispatchDeps = {
        actions: { lockDevice: mockLockDevice() },
        services: {
            analytics: mockDesktopAnalytics(),
            findNetworkSymbolForProtocol,
            suiteRouterHistory: {
                getLocation: jest.fn(),
                navigate: jest.fn(),
                listen: jest.fn(),
            },
        },
    };

    const { actions, dispatch } = createMockDispatch({
        getState,
        extra,
    });

    return { actions, dispatch, getState, extra };
};

describe('Protocol actions', () => {
    it('saves address, amount and label from Bitcoin URI protocol', () => {
        const { actions, dispatch, getState, extra } = createHandleProtocolRequestDeps();

        protocolActions.handleProtocolRequestThunk('bitcoin:12345abcde?amount=1.02&label=Alice')(
            dispatch,
            getState,
            extra,
        );

        expect(actions).toHaveLength(2);
        expect(actions).toContainEqual(
            expect.objectContaining({
                type: protocolConstants.SAVE_COIN_PROTOCOL,
                payload: expect.objectContaining({
                    scheme: 'bitcoin',
                    address: '12345abcde',
                    amount: '1.02',
                    label: 'Alice',
                }),
            }),
        );
    });

    it('saves address from Bitcoin URI protocol', () => {
        const { actions, dispatch, getState, extra } = createHandleProtocolRequestDeps();

        protocolActions.handleProtocolRequestThunk('bitcoin:12345abcde')(dispatch, getState, extra);

        expect(actions).toHaveLength(2);
        expect(actions).toContainEqual(
            expect.objectContaining({
                type: protocolConstants.SAVE_COIN_PROTOCOL,
                payload: expect.objectContaining({
                    scheme: 'bitcoin',
                    address: '12345abcde',
                    amount: undefined,
                }),
            }),
        );
    });

    it('does not throw on a trading-redirect deeplink with malformed percent-encoding', () => {
        const { dispatch, getState, extra } = createHandleProtocolRequestDeps();

        // `%` is an invalid percent-escape; decodeURIComponent would throw a URIError
        // synchronously. The URI is untrusted (web `?uri=` param / desktop
        // `protocol/open` deeplink), so the handler must decode defensively and bail
        // out instead of crashing the protocol-handling dispatch.
        expect(() =>
            protocolActions.handleProtocolRequestThunk('trezorsuite://buy-redirect?p=%')(
                dispatch,
                getState,
                extra,
            ),
        ).not.toThrow();
    });

    it('creates the reset protocol action', () => {
        expect(protocolActions.resetProtocol()).toEqual({
            type: protocolConstants.RESET,
        });
    });
});
