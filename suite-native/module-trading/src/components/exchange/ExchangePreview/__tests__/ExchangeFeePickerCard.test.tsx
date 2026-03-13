import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { ExchangeFeePickerCard, ExchangeFeePickerCardProps } from '../ExchangeFeePickerCard';

describe('ExchangeFeePickerCard', () => {
    const renderExchangeFeePickerCard = (
        props: Partial<ExchangeFeePickerCardProps> = {},
        tradingAccountKey = 'btc-account-1',
    ) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
        preloadedState.wallet!.trading!.composedTransactionInfo = { composed: { fee: '1000' } };
        preloadedState.wallet!.trading!.exchange!.tradingAccountKey = tradingAccountKey;

        return renderWithStoreProviderAsync(
            <ExchangeFeePickerCard isTxnError={false} {...props} />,
            { preloadedState },
        );
    };

    it('should render nothing when isTxnError', async () => {
        const { toJSON } = await renderExchangeFeePickerCard({
            quote: exchangeQuotes[0],
            isTxnError: true,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when there is no quote', async () => {
        const { toJSON } = await renderExchangeFeePickerCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', async () => {
        const { toJSON } = await renderExchangeFeePickerCard(
            { quote: exchangeQuotes[0] },
            'unknown-account-key',
        );

        expect(toJSON()).toBeNull();
    });

    it('should render FeeSummaryCard otherwise', async () => {
        const { toJSON } = await renderExchangeFeePickerCard({ quote: exchangeQuotes[0] });

        expect(toJSON()).not.toBeNull();
    });
});
