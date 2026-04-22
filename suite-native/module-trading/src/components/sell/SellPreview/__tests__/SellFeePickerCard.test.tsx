import { type AccountKey } from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';
import { banxaCreditCardSellQuote, eth1NormalAccount } from '@suite-native/trading-fixtures';
import type { ProviderConfirmationStatus } from '@suite-native/trading-types';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import { SellFeePickerCard, type SellFeePickerCardProps } from '../SellFeePickerCard';

// Mock FeeSelector to avoid deep dependency chain
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSelector: jest.fn(() => null),
}));

describe('SellFeePickerCard', () => {
    const renderSellFeePickerCard = (
        props: Partial<SellFeePickerCardProps> = {},
        tradingAccountKey: AccountKey = eth1NormalAccount.key,
        providerConfirmationStatus: ProviderConfirmationStatus = 'confirmation_success',
    ) =>
        renderWithTradingProvider(<SellFeePickerCard isTxnError={false} {...props} />, {
            tradeType: 'sell',
            overrides: {
                wallet: {
                    trading: {
                        sell: { tradingAccountKey },
                        providerConfirmationStatus,
                    },
                },
            },
        });

    it('should render nothing when isTxnError', () => {
        const { toJSON } = renderSellFeePickerCard({
            quote: banxaCreditCardSellQuote,
            isTxnError: true,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderSellFeePickerCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no cryptoCurrency', () => {
        const quoteWithoutCrypto = {
            ...banxaCreditCardSellQuote,
            cryptoCurrency: undefined,
        };
        const { toJSON } = renderSellFeePickerCard({ quote: quoteWithoutCrypto });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderSellFeePickerCard(
            { quote: banxaCreditCardSellQuote },
            'unknown-account-key' as AccountKey,
        );

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when providerConfirmationStatus is not in "confirmation_success" state', () => {
        const { toJSON } = renderSellFeePickerCard(
            { quote: banxaCreditCardSellQuote },
            eth1NormalAccount.key,
            'window_closed_with_success',
        );

        expect(toJSON()).toBeNull();
    });

    it('should render FeePickerCard otherwise', () => {
        const { getByText } = renderSellFeePickerCard({ quote: banxaCreditCardSellQuote });

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.details')),
        ).toBeOnTheScreen();
    });
});
