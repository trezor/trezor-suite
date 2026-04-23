import type { TradingTransaction } from '@suite-common/trading';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    accounts,
    getBuyTrade,
    getExchangeTrade,
    getInitializedTradingState,
    getSellTrade,
} from '@suite-native/trading-fixtures';

jest.mock('@suite-native/trading-state', () => {
    const actual = jest.requireActual('@suite-native/trading-state');

    return {
        ...actual,
        // selectAccountLabelWithNetworkFallback uses parseAccountKey internally which splits
        // the account key by '-' and fails for mockWalletAccount descriptors containing hyphens
        // (e.g. 'eth1-normal-eth-1@2:3'). Override with a direct key lookup + real network fallback.
        selectAccountLabelWithNetworkFallback: (state: any, accountKey: any, cryptoId: any) => {
            if (accountKey) {
                const account = state?.wallet?.accounts?.find((a: any) => a.key === accountKey);

                if (account?.accountLabel) return account.accountLabel;
            }

            // Delegate to real implementation for network name / unknown fallback,
            // with accounts cleared so it skips the broken account-lookup path.
            return actual.selectAccountLabelWithNetworkFallback(
                { ...state, wallet: { ...state?.wallet, accounts: [] } },
                undefined,
                cryptoId,
            );
        },
    };
});

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import {
    TradeDetailTransactionInfo,
    type TradeDetailTransactionInfoProps,
} from '../TradeDetailTransactionInfo';

const getOverrides = (
    trades: TradingTransaction[],
): PreloadedStatePartial<TradingTestPreloadedState> => ({
    device: {
        devices: [],
        selectedDevice: {
            state: {
                staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID,
            },
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
        overrides = getOverrides([]),
    ) =>
        renderWithTradingProvider(<TradeDetailTransactionInfo orderId={orderId} />, {
            overrides,
            providers: ['intl', 'formatter'],
        });

    it('should not render when trade is not found', () => {
        const { toJSON } = renderComponent('nonexistent_order_id', getOverrides([]));

        expect(toJSON()).toBeNull();
    });

    it('should render buy trade transaction info correctly', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByText, queryByText } = renderComponent(
            buyTrade.data.orderId!,
            getOverrides([buyTrade]),
        );

        expect(getByText('$1,234.00')).toBeTruthy();
        expect(getByText('0.462586 ETH')).toBeTruthy();
        expect(queryByText('From')).toBeNull();
    });

    it('should render correct account name for buy trade', () => {
        const buyTrade = getBuyTrade({ status: 'SUBMITTED' });

        const { getByText } = renderComponent(buyTrade.data.orderId!, getOverrides([buyTrade]));

        expect(getByText('ETH Account #1')).toBeTruthy();
    });

    it('should render exchange trade transaction info correctly', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { getByText } = renderComponent(
            exchangeTrade.data.orderId!,
            getOverrides([exchangeTrade]),
        );

        expect(getByText('10.1232 JTO')).toBeTruthy();
        expect(getByText('0.462586 SOL')).toBeTruthy();
    });

    it('should render correct account name for exchange trade', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });

        const { getAllByText } = renderComponent(
            exchangeTrade.data.orderId!,
            getOverrides([exchangeTrade]),
        );

        // For exchange trades, both from and to accounts are displayed and they are the same account
        expect(getAllByText('SOL Account #1')).toHaveLength(2);
    });

    it('should render exchange trade even when accounts are not found', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
        const overridesState = getOverrides([exchangeTrade]);
        overridesState!.wallet!.accounts = []; // remove all accounts

        const { getByText, getAllByText } = renderComponent(
            exchangeTrade.data.orderId!,
            overridesState,
        );

        expect(getByText('10.1232 JTO')).toBeTruthy();
        expect(getByText('0.462586 SOL')).toBeTruthy();
        expect(getAllByText('Solana')).toHaveLength(2);
    });

    it('should render "Unknown" when asset network is not found', () => {
        const exchangeTrade = getExchangeTrade({ status: 'CONVERTING' });
        exchangeTrade.data.send = 'unknown-asset' as any;
        exchangeTrade.data.receive = 'unknown-asset' as any;
        const overridesState = getOverrides([exchangeTrade]);
        overridesState!.wallet!.accounts = []; // remove all accounts

        const { getAllByText } = renderComponent(exchangeTrade.data.orderId!, overridesState);

        expect(getAllByText('Unknown')).toHaveLength(2);
    });

    it('should render sell trade transaction info correctly', () => {
        const sellTrade = getSellTrade({ status: 'SEND_CRYPTO' });

        const { getByText, queryByText } = renderComponent(
            sellTrade.data.orderId!,
            getOverrides([sellTrade]),
        );

        expect(getByText('1.22 BTC')).toBeTruthy();
        expect(getByText('$100.00')).toBeTruthy();
        expect(queryByText('From')).toBeTruthy();
    });

    it('should render correct account name for sell trade', () => {
        const sellTrade = getSellTrade({ status: 'SEND_CRYPTO' });

        const { getByText } = renderComponent(sellTrade.data.orderId!, getOverrides([sellTrade]));

        expect(getByText('BTC Account #1')).toBeTruthy();
    });
});
