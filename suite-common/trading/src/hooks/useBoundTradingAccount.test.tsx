import { type UnknownAction } from '@reduxjs/toolkit';
import { act } from '@testing-library/react';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockActionType } from '@trezor/redux-utils/mocks';

import { useBoundTradingAccount } from './useBoundTradingAccount';
import { tradingSellActions } from '../reducers/sellReducer';
import { type TradingRootState, initialState } from '../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../reducers/tradingReducer';
import { type TradingAmountLimitProps, type TradingType } from '../types';

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const HOST_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const OTHER_HOST_ACCOUNT = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('otherhost'),
});
const previousAccountKey = mockAccountKey({ descriptor: 'previousaccount' });
const STALE_AMOUNT_LIMITS: TradingAmountLimitProps = { currency: 'BTC' };

type BindingProps = {
    type: TradingType;
    account: Account;
};

const renderBinding = (
    initialProps: BindingProps,
    storedAccountKey: Account['key'] = previousAccountKey,
) => {
    const renders: boolean[] = [];
    const preloadedState: TradingRootState = {
        wallet: {
            trading: {
                ...initialState,
                activeSection: 'exchange',
                buy: {
                    ...initialState.buy,
                    tradingAccountKey: storedAccountKey,
                    receiveAccountKey: storedAccountKey,
                    transactionId: 'stale-order',
                    amountLimits: STALE_AMOUNT_LIMITS,
                },
                sell: {
                    ...initialState.sell,
                    tradingAccountKey: storedAccountKey,
                    transactionId: 'stale-order',
                    amountLimits: STALE_AMOUNT_LIMITS,
                },
                exchange: {
                    ...initialState.exchange,
                    tradingAccountKey: storedAccountKey,
                    transactionId: 'stale-order',
                    amountLimits: STALE_AMOUNT_LIMITS,
                },
            },
        },
    };

    const { services } = createTestCompositionRoot<void, TradingRootState>({
        reducer: (state = preloadedState, action: UnknownAction) => ({
            wallet: { trading: tradingReducer(state.wallet.trading, action) },
        }),
        preloadedState,
    });

    const { result, rerender, unmount } = renderHookWithStoreProvider(
        ({ type, account }: BindingProps) => {
            const isBound = useBoundTradingAccount(type, account);

            renders.push(isBound);

            return isBound;
        },
        { services, initialProps },
    );

    return { result, rerender, unmount, renders, store: services.store };
};

describe('useBoundTradingAccount', () => {
    it.each<TradingType>(['buy', 'sell', 'exchange'])(
        'binds the %s form to the account before reporting it bound',
        type => {
            const { result, renders, store } = renderBinding({ type, account: HOST_ACCOUNT });

            expect(renders[0]).toBe(false);
            expect(result.current).toBe(true);
            expect(store.getState().wallet.trading.activeSection).toBe(type);
            expect(store.getState().wallet.trading[type]).toEqual(
                expect.objectContaining({
                    tradingAccountKey: HOST_ACCOUNT.key,
                    transactionId: undefined,
                    amountLimits: undefined,
                }),
            );
        },
    );

    it('binds the buy receive account as well', () => {
        const { store } = renderBinding({ type: 'buy', account: HOST_ACCOUNT });

        expect(store.getState().wallet.trading.buy.receiveAccountKey).toBe(HOST_ACCOUNT.key);
    });

    it('keeps the saved form state when the same account is bound again', () => {
        const { store } = renderBinding({ type: 'sell', account: HOST_ACCOUNT }, HOST_ACCOUNT.key);

        expect(store.getState().wallet.trading.sell.amountLimits).toEqual(STALE_AMOUNT_LIMITS);
        expect(store.getState().wallet.trading.sell.transactionId).toBeUndefined();
    });

    it('rebinds when the type changes for the same account', () => {
        const { rerender, renders, store } = renderBinding({
            type: 'sell',
            account: HOST_ACCOUNT,
        });

        renders.length = 0;
        rerender({ type: 'buy', account: HOST_ACCOUNT });

        expect(renders[0]).toBe(false);
        expect(renders.at(-1)).toBe(true);
        expect(store.getState().wallet.trading.activeSection).toBe('buy');
        expect(store.getState().wallet.trading.buy.tradingAccountKey).toBe(HOST_ACCOUNT.key);
    });

    it('rebinds when the account changes back to a previous one', () => {
        const { rerender, renders, store } = renderBinding({
            type: 'sell',
            account: HOST_ACCOUNT,
        });

        rerender({ type: 'sell', account: OTHER_HOST_ACCOUNT });
        renders.length = 0;
        rerender({ type: 'sell', account: HOST_ACCOUNT });

        expect(renders[0]).toBe(false);
        expect(renders.at(-1)).toBe(true);
        expect(store.getState().wallet.trading.sell.tradingAccountKey).toBe(HOST_ACCOUNT.key);
    });

    it('stays mounted when the form picks another account', () => {
        const { rerender, renders, store } = renderBinding({
            type: 'sell',
            account: HOST_ACCOUNT,
        });

        renders.length = 0;
        act(() => {
            store.dispatch(tradingSellActions.setTradingAccountKey(previousAccountKey));
        });
        rerender({ type: 'sell', account: HOST_ACCOUNT });

        expect(renders).not.toContain(false);
        expect(store.getState().wallet.trading.sell.tradingAccountKey).toBe(previousAccountKey);
    });
});
