import '@suite-common/test-utils/globalOverrides';

import { type UnknownAction } from '@reduxjs/toolkit';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type TradingAmountLimitProps,
    type TradingType,
    prepareTradingReducer,
    initialState as tradingInitialState,
} from '@suite-common/trading';
import { mock } from '@trezor/dependency-injection';
import { mockActionType } from '@trezor/redux-utils/mocks';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { TradingTypeTabs } from './TradingTypeTabs';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const amountLimits: TradingAmountLimitProps = { currency: 'BTC' };

const renderTabs = (activeType?: TradingType) => {
    const onTypeChange = mock<(type: TradingType) => void>();
    const preloadedState = {
        ...mockInitialAppState,
        wallet: {
            ...mockInitialAppState.wallet,
            trading: {
                ...tradingInitialState,
                buy: { ...tradingInitialState.buy, amountLimits },
                sell: { ...tradingInitialState.sell, amountLimits },
                exchange: { ...tradingInitialState.exchange, amountLimits },
            },
        },
    } satisfies AppState;

    const { services } = createTestCompositionRoot<void, AppState>({
        reducer: (state = preloadedState, action: UnknownAction) => ({
            ...state,
            wallet: { ...state.wallet, trading: tradingReducer(state.wallet.trading, action) },
        }),
        preloadedState,
    });

    renderWithProviders(
        services,
        <TradingTypeTabs activeType={activeType} onTypeChange={onTypeChange} />,
    );

    return { store: services.store, onTypeChange };
};

const getAmountLimits = (store: ReturnType<typeof renderTabs>['store']) => ({
    buy: store.getState().wallet.trading.buy.amountLimits,
    sell: store.getState().wallet.trading.sell.amountLimits,
    exchange: store.getState().wallet.trading.exchange.amountLimits,
});

describe('TradingTypeTabs', () => {
    it('clears the quotes of the selected type and reports the change', async () => {
        const { store, onTypeChange } = renderTabs('exchange');

        await userEvent.click(screen.getByTestId('@trading/menu/wallet-trading-buy'));

        expect(onTypeChange).toHaveBeenCalledWith('buy');
        expect(getAmountLimits(store)).toEqual({
            buy: undefined,
            sell: amountLimits,
            exchange: amountLimits,
        });
    });

    it('ignores a click on the active tab', async () => {
        const { store, onTypeChange } = renderTabs('buy');

        await userEvent.click(screen.getByTestId('@trading/menu/wallet-trading-buy'));

        expect(onTypeChange).not.toHaveBeenCalled();
        expect(getAmountLimits(store)).toEqual({
            buy: amountLimits,
            sell: amountLimits,
            exchange: amountLimits,
        });
    });
});
