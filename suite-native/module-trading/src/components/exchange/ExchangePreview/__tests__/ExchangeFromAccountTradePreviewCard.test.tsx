import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import {
    ExchangeFromAccountTradePreviewCard,
    type ExchangeFromAccountTradePreviewCardProps,
} from '../ExchangeFromAccountTradePreviewCard';

describe('ExchangeFromAccountTradePreviewCard', () => {
    const renderExchangeFromAccountTradePreviewCard = (
        props: Partial<ExchangeFromAccountTradePreviewCardProps> = {},
        tradingAccountKey = 'btc-account-1',
    ) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
        preloadedState.wallet!.trading!.composedTransactionInfo = { composed: { fee: '1000' } };
        preloadedState.wallet!.trading!.exchange!.tradingAccountKey = tradingAccountKey;

        return renderWithStoreProvider(
            <ExchangeFromAccountTradePreviewCard fromStringValue="100" {...props} />,
            {
                preloadedState,
            },
        );
    };

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderExchangeFromAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderExchangeFromAccountTradePreviewCard(
            { quote: exchangeQuotes[0] },
            'unknown-account-key',
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradeSideCard otherwise', () => {
        const { getByText } = renderExchangeFromAccountTradePreviewCard({
            quote: exchangeQuotes[0],
        });

        expect(getByText('Account')).toBeOnTheScreen();
        expect(getByText('-100')).toBeOnTheScreen();
    });

    // Todo: https://github.com/trezor/trezor-suite/issues/24906
    it.skip('should display correct account name', () => {
        const { getByText } = renderExchangeFromAccountTradePreviewCard({
            quote: exchangeQuotes[0],
        });
        expect(getByText('BTC Account #1')).toBeOnTheScreen();
    });

    it('should render value in fiat when fromValue is provided', () => {
        const { getByText } = renderExchangeFromAccountTradePreviewCard({
            quote: exchangeQuotes[0],
            fromValue: '1',
        });

        expect(getByText(`1-${exchangeQuotes[0].send}`)).toBeOnTheScreen();
    });
});
