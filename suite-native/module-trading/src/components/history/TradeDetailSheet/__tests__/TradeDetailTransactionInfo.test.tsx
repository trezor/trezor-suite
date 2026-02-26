import type { TradingTransaction } from '@suite-common/trading';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import {
    accounts,
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingState,
    getSellTrade,
} from '@suite-native/trading-fixtures';
import type { StaticSessionId } from '@trezor/connect';

import {
    TradeDetailTransactionInfo,
    type TradeDetailTransactionInfoProps,
} from '../TradeDetailTransactionInfo';

const getPreloadedState = (trades: TradingTransaction[]): PreloadedState => ({
    device: {
        selectedDevice: {
            state: {
                staticSessionId: 'staticSessionId' as StaticSessionId,
            },
            connected: true,
            available: true,
            remember: true,
        },
    },
    wallet: {
        accounts,
        trading: {
            ...getInitializedTradingState(),
            trades,
        },
    },
});

describe('TradeDetailTransactionInfo', () => {
    const renderComponent = (
        orderId: TradeDetailTransactionInfoProps['orderId'],
        preloadedState = getPreloadedState([]),
    ) =>
        renderWithStoreProvider(<TradeDetailTransactionInfo orderId={orderId} />, {
            preloadedState,
        });

    it('should not render when trade is not found', () => {
        const { toJSON } = renderComponent('nonexistent_order_id', getPreloadedState([]));

        expect(toJSON()).toBeNull();
    });

    it('should render buy trade transaction info correctly', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByText, queryByText } = renderComponent(
            buyTrade.data.orderId!,
            getPreloadedState([buyTrade]),
        );

        expect(getByText('$1,234.00')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
        expect(queryByText('From')).toBeNull();
    });

    // Todo: https://github.com/trezor/trezor-suite/issues/24906
    it.skip('should render correct account name for buy trade', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByText } = renderComponent(
            buyTrade.data.orderId!,
            getPreloadedState([buyTrade]),
        );

        expect(getByText('ETH Account #1')).toBeTruthy();
    });

    it('should render exchange trade transaction info correctly', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { getByText } = renderComponent(
            exchangeTrade.data.orderId!,
            getPreloadedState([exchangeTrade]),
        );

        expect(getByText('10.1232 JTO')).toBeTruthy();
        expect(getByText('0.462586 SOL')).toBeTruthy();
    });

    // Todo: https://github.com/trezor/trezor-suite/issues/24906
    it.skip('should render correct account name for exchange trade', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { getAllByText } = renderComponent(
            exchangeTrade.data.orderId!,
            getPreloadedState([exchangeTrade]),
        );

        // For exchange trades, both from and to accounts are displayed and they are the same account
        expect(getAllByText('SOL Account #1')).toHaveLength(2);
    });

    it('should render exchange trade even when accounts are not found', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
        const preloadedState = getPreloadedState([exchangeTrade]);
        preloadedState!.wallet!.accounts = []; // remove all accounts

        const { getByText, getAllByText } = renderComponent(
            exchangeTrade.data.orderId!,
            preloadedState,
        );

        expect(getByText('10.1232 JTO')).toBeTruthy();
        expect(getByText('0.462586 SOL')).toBeTruthy();
        expect(getAllByText('Solana')).toHaveLength(2);
    });

    it('should render "Unknown" when asset network is not found', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
        exchangeTrade.data.send = 'unknown-asset' as any;
        exchangeTrade.data.receive = 'unknown-asset' as any;
        const preloadedState = getPreloadedState([exchangeTrade]);
        preloadedState!.wallet!.accounts = []; // remove all accounts

        const { getAllByText } = renderComponent(exchangeTrade.data.orderId!, preloadedState);

        expect(getAllByText('Unknown')).toHaveLength(2);
    });

    it('should render sell trade transaction info correctly', () => {
        const sellTrade = getSellTrade({ status: 'SEND_CRYPTO' });

        const { getByText, queryByText } = renderComponent(
            sellTrade.data.orderId!,
            getPreloadedState([sellTrade]),
        );

        expect(getByText('1.22 BTC')).toBeTruthy();
        expect(getByText('$100.00')).toBeTruthy();
        expect(queryByText('From')).toBeTruthy();
    });

    // Todo: https://github.com/trezor/trezor-suite/issues/24906
    it.skip('should render correct account name for sell trade', () => {
        const sellTrade = getSellTrade({ status: 'SEND_CRYPTO' });

        const { getByText } = renderComponent(
            sellTrade.data.orderId!,
            getPreloadedState([sellTrade]),
        );

        expect(getByText('BTC Account #1')).toBeTruthy();
    });
});
