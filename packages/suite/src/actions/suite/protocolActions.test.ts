import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { mockLockDevice } from '@suite-common/device/mocks';
import { networksActions, networksReducer } from '@suite-common/networks';
import { mockNetworkMetadata } from '@suite-common/networks/mocks';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';

import * as protocolConstants from './constants/protocolConstants';
import * as protocolActions from './protocolActions';
import {
    type HandleProtocolRequestDispatchDeps,
    type HandleProtocolRequestThunkState,
} from './protocolActions';
import { mockInitialAppState } from '../../../mocks/mockInitialAppState';

jest.mock('@suite-common/walletconnect', () => ({
    walletConnectPairThunk: jest.fn(),
}));

const createHandleProtocolRequestDeps = () => {
    const state: HandleProtocolRequestThunkState = {
        ...mockInitialAppState,
        networks: networksReducer(null, networksActions.setNetworks([mockNetworkMetadata.btc])),
    };
    const getState = () => state;
    const extra: HandleProtocolRequestDispatchDeps = {
        actions: { lockDevice: mockLockDevice() },
        services: {
            analytics: mockDesktopAnalytics(),
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

    it('creates the reset protocol action', () => {
        expect(protocolActions.resetProtocol()).toEqual({
            type: protocolConstants.RESET,
        });
    });
});
