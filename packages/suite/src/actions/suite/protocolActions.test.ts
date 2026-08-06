import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type FindNetworkSymbolForProtocol } from '@suite-common/networks';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import type { AppState } from 'src/types/suite';

import * as protocolConstants from './constants/protocolConstants';
import * as protocolActions from './protocolActions';
import { type HandleProtocolRequestDeps } from './protocolActions';

const findNetworkSymbolForProtocol: FindNetworkSymbolForProtocol = protocol =>
    protocol === 'bitcoin' ? asNetworkSymbol('btc') : null;

const createHandleProtocolRequestDeps = () => {
    const getState = () => ({}) as AppState;
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

    const { actions, dispatch } = createMockDispatch({ getState, extra });

    return { actions, dispatch, getState, extra };
};

describe('Protocol actions', () => {
    it('saves address and amount from Bitcoin URI protocol', () => {
        const { actions, dispatch, getState, extra } = createHandleProtocolRequestDeps();

        protocolActions.handleProtocolRequest('bitcoin:12345abcde?amount=1.02')(
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
                }),
            }),
        );
    });

    it('saves address from Bitcoin URI protocol', () => {
        const { actions, dispatch, getState, extra } = createHandleProtocolRequestDeps();

        protocolActions.handleProtocolRequest('bitcoin:12345abcde')(dispatch, getState, extra);

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

    it('creates the reset protocol action', () => {
        expect(protocolActions.resetProtocol()).toEqual({
            type: protocolConstants.RESET,
        });
    });
});
