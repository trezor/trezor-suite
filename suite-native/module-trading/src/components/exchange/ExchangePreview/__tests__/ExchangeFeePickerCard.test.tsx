import { type PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { exchangeQuotes, getWalletState } from '@suite-native/trading-fixtures';

import { ExchangeFeePickerCard, type ExchangeFeePickerCardProps } from '../ExchangeFeePickerCard';

// Mock FeeSelector to avoid deep dependency chain
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSelector: jest.fn(() => null),
}));

describe('ExchangeFeePickerCard', () => {
    const renderExchangeFeePickerCard = (
        props: Partial<ExchangeFeePickerCardProps> = {},
        tradingAccountKey = 'btc-account-1',
    ) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
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

    it('should render FeePickerCard otherwise', async () => {
        const { getByText } = await renderExchangeFeePickerCard({ quote: exchangeQuotes[0] });

        expect(getByText('Transaction details')).toBeOnTheScreen();
    });
});
