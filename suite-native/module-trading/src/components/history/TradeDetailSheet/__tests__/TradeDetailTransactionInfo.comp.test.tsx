import { TradingTransaction } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { StaticSessionId } from '@trezor/connect';

import fixturesAccounts from '../../../../__fixtures__/accounts.json';
import { getBuyTrade, getExchangeTrade, getSellTrade } from '../../../../__fixtures__/trades';
import { getInitializedTradingState } from '../../../../__fixtures__/tradingState';
import {
    TradeDetailTransactionInfo,
    TradeDetailTransactionInfoProps,
} from '../TradeDetailTransactionInfo';

const accounts = fixturesAccounts as Account[];
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
        tradingNew: {
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

    it('should render buy trade transaction info correctly', async () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByText, queryByText } = await renderComponent(
            buyTrade.data.orderId!,
            getPreloadedState([buyTrade]),
        );

        expect(getByText('1234 USD')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
        expect(getByText('ETH Account #1')).toBeTruthy();
        expect(queryByText('From')).toBeNull();
    });

    it('should render exchange trade transaction info correctly', async () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { getByText } = await renderComponent(
            exchangeTrade.data.orderId!,
            getPreloadedState([exchangeTrade]),
        );

        expect(
            getByText('10.1232 solana--jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL'),
        ).toBeTruthy();
        expect(getByText('0.462586 solana')).toBeTruthy();
        expect(getByText('SOL Account #1')).toBeTruthy();
    });

    it('should render sell trade transaction info correctly', async () => {
        const sellTrade = getSellTrade({ status: 'SEND_CRYPTO' });

        const { getByText, queryByText } = await renderComponent(
            sellTrade.data.orderId!,
            getPreloadedState([sellTrade]),
        );

        expect(getByText('1.22 BTC')).toBeTruthy();
        expect(getByText('100 USD')).toBeTruthy();
        expect(getByText('BTC Account #1')).toBeTruthy();
        expect(queryByText('From')).toBeTruthy();
    });
});
