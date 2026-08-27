import type { CryptoId } from 'invity-api';

import { type TradingTransaction } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { userEvent } from '@suite-native/test-utils';
import {
    btc1NormalAccount,
    eth1NormalAccount,
    getBuyTrade,
    getExchangeTrade,
    getSellTrade,
    mercuryoDexQuote,
} from '@suite-native/trading-fixtures';

import { TradingHistoryDetailInfo } from './TradingHistoryDetailInfo';
import { renderWithTradingHistoryProvider } from '../../test-utils/tradingHistoryTestUtils';

const mockCopyToClipboard = jest.fn(() => Promise.resolve());

jest.mock('@suite-native/clipboard', () => ({
    useCopyToClipboard: () => mockCopyToClipboard,
}));

describe('TradingHistoryDetailInfo', () => {
    const renderInfo = (trade?: TradingTransaction, isMevProtectionEnabled = true) =>
        renderWithTradingHistoryProvider(
            <TradingHistoryDetailInfo orderId={trade?.data.orderId ?? 'missing-order-id'} />,
            {
                overrides: {
                    wallet: {
                        settings: {
                            mevProtection: isMevProtectionEnabled,
                        },
                        trading: {
                            trades: trade ? [trade] : [],
                        },
                    },
                },
            },
        );

    beforeEach(() => {
        mockCopyToClipboard.mockClear();
    });

    it('does not render when the trade is not found', () => {
        const { toJSON } = renderInfo();

        expect(toJSON()).toBeNull();
    });

    it('renders buy amounts, payment method, provider, and destination account', () => {
        const { getByLabelText, getByText } = renderInfo(getBuyTrade({ status: 'SUCCESS' }));

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.youPay')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.youGet')),
        ).toBeOnTheScreen();
        expect(getByText('1,234')).toBeOnTheScreen();
        expect(getByText('0.462586')).toBeOnTheScreen();
        expect(getByText('USD')).toBeOnTheScreen();
        expect(getByText('ETH')).toBeOnTheScreen();
        expect(getByText('Ethereum')).toBeOnTheScreen();
        expect(getByText('to ETH Account #1')).toBeOnTheScreen();
        expect(getByText('Credit/Debit Card')).toBeOnTheScreen();
        expect(getByText('Mercuryo')).toBeOnTheScreen();
        expect(getByText(/2025/)).toBeOnTheScreen();
        expect(getByLabelText(getTranslation('tradingAtoms.providerLogo'))).toBeOnTheScreen();
        expect(getByLabelText('Credit Card')).toBeOnTheScreen();
        expect(getByLabelText('flag-US')).toBeOnTheScreen();
    });

    it('renders sell payout information and source account', () => {
        const sellTrade = getSellTrade({ status: 'SUCCESS' });
        const trade = {
            ...sellTrade,
            data: {
                ...sellTrade.data,
                paymentMethod: 'bankTransfer' as const,
                paymentMethodName: 'Bank Transfer',
            },
        };
        const { getByText, queryByText } = renderInfo(trade);

        expect(getByText('from BTC Account #1')).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.payoutMethod')),
        ).toBeOnTheScreen();
        expect(getByText('Bank Transfer')).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('moduleTrading.tradeHistory.detail.info.paymentMethod')),
        ).not.toBeOnTheScreen();
    });

    it('renders the fixed-rate information for a CEX swap', () => {
        const { getByText, queryByText } = renderInfo(getExchangeTrade({ status: 'SUCCESS' }));

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.rate')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.fixed')),
        ).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('moduleTrading.tradeHistory.detail.info.maximumSlippage')),
        ).not.toBeOnTheScreen();
    });

    it('renders the floating-rate information from provider metadata', () => {
        const exchangeTrade = getExchangeTrade({ status: 'SUCCESS' });
        const trade = {
            ...exchangeTrade,
            data: { ...exchangeTrade.data, exchange: 'cexdirect' },
        };
        const { getByText } = renderInfo(trade);

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.floating')),
        ).toBeOnTheScreen();
    });

    it('falls back to exchange and network names when metadata is missing', () => {
        const exchangeTrade = getExchangeTrade({ status: 'SUCCESS' });
        const trade = {
            ...exchangeTrade,
            sendAccountKey: undefined,
            receiveAccountKey: undefined,
            data: { ...exchangeTrade.data, exchange: 'unknown-provider' },
        };
        const { getByText, queryByLabelText } = renderInfo(trade);

        expect(getByText('from Solana')).toBeOnTheScreen();
        expect(getByText('to Solana')).toBeOnTheScreen();
        expect(getByText('UNKNOWN-PROVIDER')).toBeOnTheScreen();
        expect(queryByLabelText(getTranslation('tradingAtoms.providerLogo'))).not.toBeOnTheScreen();
    });

    it('renders DEX slippage, minimum received, and the current MEV setting', () => {
        const exchangeTrade = getExchangeTrade({ status: 'SUCCESS' });
        const trade = {
            ...exchangeTrade,
            sendAccountKey: eth1NormalAccount.key,
            receiveAccountKey: btc1NormalAccount.key,
            data: {
                ...exchangeTrade.data,
                ...mercuryoDexQuote,
                send: 'ethereum' as CryptoId,
                receive: 'bitcoin' as CryptoId,
                receiveStringAmount: '800',
                swapSlippage: '1',
                status: 'SUCCESS' as const,
            },
        };
        const { getByTestId, getByText, queryByText } = renderInfo(trade);

        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.mevProtection')),
        ).toBeOnTheScreen();
        expect(getByTestId('@trading/history/detail/info/mev-enabled')).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradeHistory.detail.info.maximumSlippage')),
        ).toBeOnTheScreen();
        expect(getByText('1%')).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation('moduleTrading.tradeHistory.detail.info.minimumReceivedAmount'),
            ),
        ).toBeOnTheScreen();
        expect(getByText('792 BTC')).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('moduleTrading.tradeHistory.detail.info.rate')),
        ).not.toBeOnTheScreen();
    });

    it('does not show MEV protection for an unsupported send network', () => {
        const exchangeTrade = getExchangeTrade({ status: 'SUCCESS' });
        const trade = {
            ...exchangeTrade,
            data: { ...exchangeTrade.data, isDex: true, swapSlippage: '1' },
        };
        const { queryByText } = renderInfo(trade);

        expect(
            queryByText(getTranslation('moduleTrading.tradeHistory.detail.info.mevProtection')),
        ).not.toBeOnTheScreen();
    });

    it('shows disabled MEV protection from the current wallet setting', () => {
        const exchangeTrade = getExchangeTrade({ status: 'SUCCESS' });
        const trade = {
            ...exchangeTrade,
            sendAccountKey: eth1NormalAccount.key,
            receiveAccountKey: btc1NormalAccount.key,
            data: {
                ...exchangeTrade.data,
                ...mercuryoDexQuote,
                send: 'ethereum' as CryptoId,
                receive: 'bitcoin' as CryptoId,
                status: 'SUCCESS' as const,
            },
        };
        const { getByTestId } = renderInfo(trade, false);

        expect(getByTestId('@trading/history/detail/info/mev-disabled')).toBeOnTheScreen();
    });

    it('copies the full trade ID', async () => {
        const trade = getBuyTrade({ status: 'SUCCESS' });
        const { getByTestId } = renderInfo(trade);

        await userEvent.press(getByTestId('@trading/history/detail/info/trade-id'));

        expect(mockCopyToClipboard).toHaveBeenCalledWith(
            trade.data.orderId,
            getTranslation('generic.savedToClipboard'),
        );
    });
});
