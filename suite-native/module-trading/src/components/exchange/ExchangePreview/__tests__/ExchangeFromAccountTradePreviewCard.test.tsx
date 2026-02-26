// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import {
    ExchangeFromAccountTradePreviewCard,
    ExchangeFromAccountTradePreviewCardProps,
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

        return renderWithStoreProviderAsync(
            <ExchangeFromAccountTradePreviewCard fromStringValue="100" {...props} />,
            {
                preloadedState,
            },
        );
    };

    it('should render nothing when there is no quote', async () => {
        const { toJSON } = await renderExchangeFromAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', async () => {
        const { toJSON } = await renderExchangeFromAccountTradePreviewCard(
            { quote: exchangeQuotes[0] },
            'unknown-account-key',
        );

        expect(toJSON()).toBeNull();
    });

    // Todo: https://github.com/trezor/trezor-suite/issues/24906
    it.skip('should render TradeSideCard otherwise', async () => {
        const { getByText } = await renderExchangeFromAccountTradePreviewCard({
            quote: exchangeQuotes[0],
        });

        expect(getByText('Account')).toBeOnTheScreen();
        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('-100')).toBeOnTheScreen();
    });
});
