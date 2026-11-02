import '@suite-common/test-utils/globalOverrides';

import { useSelector } from 'react-redux';

import { type UnknownAction } from '@reduxjs/toolkit';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type TradingRootState,
    type TradingType,
    prepareTradingReducer,
    selectTradingBuyAccountKey,
    selectTradingBuyTransactionId,
    selectTradingExchangeAccountKey,
    selectTradingExchangeTransactionId,
    selectTradingSellAccountKey,
    selectTradingSellTransactionId,
    initialState as tradingInitialState,
} from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { mockActionType } from '@trezor/redux-utils/mocks';

import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';
import { TradingBuyFormWrapper } from 'src/views/wallet/trading/buy/TradingBuyFormWrapper';
import { TradingExchangeFormWrapper } from 'src/views/wallet/trading/exchange/TradingExchangeFormWrapper';
import { TradingSellFormWrapper } from 'src/views/wallet/trading/sell/TradingSellFormWrapper';

import { TradingFormEmbed } from './TradingFormEmbed';
import { mockInitialAppState } from '../../../../../../mocks/mockInitialAppState';

jest.mock('src/hooks/suite/useMessageSystemTrading', () => ({
    useMessageSystemTrading: jest.fn(),
}));
jest.mock('src/views/wallet/trading/buy/TradingBuyFormWrapper', () => ({
    TradingBuyFormWrapper: jest.fn(),
}));
jest.mock('src/views/wallet/trading/sell/TradingSellFormWrapper', () => ({
    TradingSellFormWrapper: jest.fn(),
}));
jest.mock('src/views/wallet/trading/exchange/TradingExchangeFormWrapper', () => ({
    TradingExchangeFormWrapper: jest.fn(),
}));

type TradingSliceSelectors = {
    accountKey: (state: TradingRootState) => Account['key'] | undefined;
    transactionId: (state: TradingRootState) => string | undefined;
};

const selectorsByType: Record<TradingType, TradingSliceSelectors> = {
    buy: { accountKey: selectTradingBuyAccountKey, transactionId: selectTradingBuyTransactionId },
    sell: {
        accountKey: selectTradingSellAccountKey,
        transactionId: selectTradingSellTransactionId,
    },
    exchange: {
        accountKey: selectTradingExchangeAccountKey,
        transactionId: selectTradingExchangeTransactionId,
    },
};

type WrapperRender = {
    accountKey: Account['key'] | undefined;
    transactionId: string | undefined;
};

const wrapperRenders: WrapperRender[] = [];

const recordingWrapper = (type: TradingType) => () => {
    const accountKey = useSelector(selectorsByType[type].accountKey);
    const transactionId = useSelector(selectorsByType[type].transactionId);

    wrapperRenders.push({ accountKey, transactionId });

    return <div data-testid={`trading-form-wrapper/${type}`} />;
};

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const HOST_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const previousAccountKey = mockAccountKey({ descriptor: 'previousaccount' });

type RenderEmbedParams = {
    type: TradingType;
    onTypeChange?: (type: TradingType) => void;
    isFinpromRestricted?: boolean;
};

const renderEmbed = ({ type, onTypeChange, isFinpromRestricted = false }: RenderEmbedParams) => {
    const preloadedState = {
        ...mockInitialAppState,
        messageSystem: mockMessageSystemStateWithFeatureFlags(
            { [Feature.finprom.presenceRestriction]: isFinpromRestricted },
            { [Feature.finprom.presenceRestriction]: { countries: ['US'] } },
        ),
        wallet: {
            ...mockInitialAppState.wallet,
            trading: {
                ...tradingInitialState,
                buy: {
                    ...tradingInitialState.buy,
                    tradingAccountKey: previousAccountKey,
                    receiveAccountKey: previousAccountKey,
                    transactionId: 'stale-order',
                },
                sell: {
                    ...tradingInitialState.sell,
                    tradingAccountKey: previousAccountKey,
                    transactionId: 'stale-order',
                },
                exchange: {
                    ...tradingInitialState.exchange,
                    tradingAccountKey: previousAccountKey,
                    transactionId: 'stale-order',
                },
            },
        },
    } as unknown as AppState;

    const { services } = createTestCompositionRoot<void, AppState>({
        reducer: (state = preloadedState, action: UnknownAction) => ({
            ...state,
            wallet: { ...state.wallet, trading: tradingReducer(state.wallet.trading, action) },
        }),
        preloadedState,
    });

    renderWithProviders(
        services,
        <TradingFormEmbed type={type} account={HOST_ACCOUNT} onTypeChange={onTypeChange} />,
    );

    return services.store;
};

describe('TradingFormEmbed', () => {
    beforeEach(() => {
        wrapperRenders.length = 0;
        jest.mocked(useMessageSystemTrading).mockReturnValue({
            isDisabled: false,
            content: undefined,
        });
        jest.mocked(TradingBuyFormWrapper).mockImplementation(recordingWrapper('buy'));
        jest.mocked(TradingSellFormWrapper).mockImplementation(recordingWrapper('sell'));
        jest.mocked(TradingExchangeFormWrapper).mockImplementation(recordingWrapper('exchange'));
    });

    it.each<TradingType>(['buy', 'sell', 'exchange'])(
        'binds the %s form to the host account before the form renders',
        type => {
            const store = renderEmbed({ type });

            expect(screen.getByTestId(`trading-form-wrapper/${type}`)).toBeInTheDocument();
            expect(wrapperRenders[0]).toEqual({
                accountKey: HOST_ACCOUNT.key,
                transactionId: undefined,
            });
            expect(store.getState().wallet.trading[type].tradingAccountKey).toBe(HOST_ACCOUNT.key);
        },
    );

    it('renders nothing and leaves the trading state untouched while trading is disabled', () => {
        jest.mocked(useMessageSystemTrading).mockReturnValue({
            isDisabled: true,
            content: undefined,
        });
        const onTypeChange = mock<(type: TradingType) => void>();

        const store = renderEmbed({ type: 'sell', onTypeChange });

        expect(screen.queryByTestId('trading-form-wrapper/sell')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@trading/menu/wallet-trading-sell')).not.toBeInTheDocument();
        expect(store.getState().wallet.trading.sell.tradingAccountKey).toBe(previousAccountKey);
        expect(store.getState().wallet.trading.sell.transactionId).toBe('stale-order');
    });

    it('renders nothing and leaves the trading state untouched when restricted', () => {
        const onTypeChange = mock<(type: TradingType) => void>();
        const store = renderEmbed({ type: 'buy', onTypeChange, isFinpromRestricted: true });

        expect(screen.queryByTestId('trading-form-wrapper/buy')).not.toBeInTheDocument();
        expect(screen.queryByTestId('@trading/menu/wallet-trading-buy')).not.toBeInTheDocument();
        expect(store.getState().wallet.trading.buy.tradingAccountKey).toBe(previousAccountKey);
    });

    it('renders no type tabs without a type change handler', () => {
        renderEmbed({ type: 'buy' });

        expect(screen.queryByTestId('@trading/menu/wallet-trading-buy')).not.toBeInTheDocument();
    });

    it('lets the host switch the type through the tabs', async () => {
        const onTypeChange = mock<(type: TradingType) => void>();
        renderEmbed({ type: 'buy', onTypeChange });

        await userEvent.click(screen.getByTestId('@trading/menu/wallet-trading-sell'));

        expect(onTypeChange).toHaveBeenCalledWith('sell');
    });
});
