import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import type { FindNetworkSymbolForProtocol } from '@suite-common/networks';

import * as protocolConstants from './constants/protocolConstants';
import * as protocolActions from './protocolActions';
import { type HandleProtocolRequestDeps } from './protocolActions';

jest.mock('@suite-common/walletconnect', () => ({
    walletConnectPairThunk: jest.fn(),
}));

const findNetworkSymbolForProtocol: FindNetworkSymbolForProtocol = protocol =>
    protocol === 'bitcoin' ? 'btc' : null;

const createHandleProtocolRequestDeps = () => {
    const dispatch = jest.fn();
    const extra: HandleProtocolRequestDeps = {
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

    // Execute nested thunks so the handler can be tested without creating a Redux store.
    dispatch.mockImplementation((action: unknown) => {
        if (typeof action === 'function') {
            action(dispatch, () => ({}), extra);
        }
    });

    return { dispatch, extra };
};

describe('Protocol actions', () => {
    it('saves address, amount and label from Bitcoin URI protocol', () => {
        const { dispatch, extra } = createHandleProtocolRequestDeps();

        protocolActions.handleProtocolRequest('bitcoin:12345abcde?amount=1.02&label=Alice')(
            dispatch,
            () => ({}),
            extra,
        );

        expect(dispatch).toHaveBeenCalledTimes(3);
        expect(dispatch).toHaveBeenCalledWith(
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
        const { dispatch, extra } = createHandleProtocolRequestDeps();

        protocolActions.handleProtocolRequest('bitcoin:12345abcde')(dispatch, () => ({}), extra);

        expect(dispatch).toHaveBeenCalledTimes(3);
        expect(dispatch).toHaveBeenCalledWith(
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

    it('creates the reset protocol action', () => {
        expect(protocolActions.resetProtocol()).toEqual({
            type: protocolConstants.RESET,
        });
    });
});
