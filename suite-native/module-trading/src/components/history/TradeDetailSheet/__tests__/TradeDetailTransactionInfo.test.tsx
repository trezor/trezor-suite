import { TradingTransaction } from '@suite-common/trading';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import {
    accounts,
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingState,
    getSellTrade,
} from '@suite-native/trading-fixtures';
import { StaticSessionId } from '@trezor/connect';

import {
    TradeDetailTransactionInfo,
    TradeDetailTransactionInfoProps,
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
        renderWithStoreProviderAsync(<TradeDetailTransactionInfo orderId={orderId} />, {
            preloadedState,
        });

    it('should not render when trade is not found', async () => {
        const { toJSON } = await renderComponent('nonexistent_order_id', getPreloadedState([]));

        expect(toJSON()).toBeNull();
    });

    // Todo: https://github.com/trezor/trezor-suite/issues/24906
    it.skip('should render buy trade transaction info correctly', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByText, queryByText } = await renderComponent(
            buyTrade.data.orderId!,
            getPreloadedState([buyTrade]),
        );

        expect(getByText('$1,234.00')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
        expect(getByText('ETH Account #1')).toBeTruthy();
        expect(queryByText('From')).toBeNull();
    });

    // Todo: https://github.com/trezor/trezor-suite/issues/24906
    it.skip('should render exchange trade transaction info correctly', async () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { getByText, getAllByText } = await renderComponent(
            exchangeTrade.data.orderId!,
            getPreloadedState([exchangeTrade]),
        );

        expect(getByText('10.1232 JTO')).toBeTruthy();
        expect(getByText('0.462586 SOL')).toBeTruthy();
        // For exchange trades, both from and to accounts are displayed and they are the same account
        expect(getAllByText('SOL Account #1')).toHaveLength(2);
    });

    it('should render exchange trade even when accounts are not found', async () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
        const preloadedState = getPreloadedState([exchangeTrade]);
        preloadedState!.wallet!.accounts = []; // remove all accounts

        const { getByText, getAllByText } = await renderComponent(
            exchangeTrade.data.orderId!,
            preloadedState,
        );

        expect(getByText('10.1232 JTO')).toBeTruthy();
        expect(getByText('0.462586 SOL')).toBeTruthy();
        expect(getAllByText('Solana')).toHaveLength(2);
    });

    it('should render "Unknown" when asset network is not found', async () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
        exchangeTrade.data.send = 'unknown-asset' as any;
        exchangeTrade.data.receive = 'unknown-asset' as any;
        const preloadedState = getPreloadedState([exchangeTrade]);
        preloadedState!.wallet!.accounts = []; // remove all accounts

        const { getAllByText } = await renderComponent(exchangeTrade.data.orderId!, preloadedState);

        expect(getAllByText('Unknown')).toHaveLength(2);
    });

    // Todo: https://github.com/trezor/trezor-suite/issues/24906
    it.skip('should render sell trade transaction info correctly', async () => {
        const sellTrade = getSellTrade({ status: 'SEND_CRYPTO' });

        const { getByText, queryByText } = await renderComponent(
            sellTrade.data.orderId!,
            getPreloadedState([sellTrade]),
        );

        expect(getByText('1.22 BTC')).toBeTruthy();
        expect(getByText('$100.00')).toBeTruthy();
        expect(getByText('BTC Account #1')).toBeTruthy();
        expect(queryByText('From')).toBeTruthy();
    });
});
