import { extraDependenciesMock } from '@suite-common/test-utils';
import { Account } from '@suite-common/wallet-types';

import {
    TradingState,
    selectBuySelectedReceiveAccount,
    setBuySelectedReceiveAccount,
    tradingSlice,
} from '../tradingSlice';

const getBtcAccount = () =>
    ({
        symbol: 'btc',
        accountType: 'normal',
        accountLabel: 'BTC Account',
        addresses: {
            used: [
                {
                    address: '1BTC',
                    path: 'm/84/0/0',
                    transfers: 0,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
            ],
            change: [],
            unused: [],
        },
    }) as unknown as Account;

describe('featureFlagsSlice', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('initial state', () => {
        it('should have correct initial state', () => {
            const tradingReducer = tradingSlice.prepareReducer(extraDependenciesMock);
            const state = tradingReducer(undefined, {
                type: 'undefined_action',
            });

            expect(state.buy.selectedReceiveAccount).toBeUndefined();
        });
    });

    describe('buy', () => {
        it('should set selectedReceiveAccount', () => {
            const tradingReducer = tradingSlice.prepareReducer(extraDependenciesMock);
            const receiveAccount = { account: getBtcAccount(), address: undefined };
            const state = tradingReducer(
                undefined,
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: receiveAccount,
                }),
            );

            expect(selectBuySelectedReceiveAccount({ wallet: { trading: state } })).toBe(
                receiveAccount,
            );
        });

        it('should set and clear selectedReceiveAccount', () => {
            const tradingReducer = tradingSlice.prepareReducer(extraDependenciesMock);
            const actions = [
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: { account: getBtcAccount(), address: undefined },
                }),
                setBuySelectedReceiveAccount({
                    selectedReceiveAccount: undefined,
                }),
            ];
            const state = actions.reduce(tradingReducer, undefined) as TradingState;

            expect(selectBuySelectedReceiveAccount({ wallet: { trading: state } })).toBeUndefined();
        });
    });
});
