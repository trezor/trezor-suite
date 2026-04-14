import { getTranslation } from '@suite-native/intl';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import { banxaCreditCardSellQuote, getWalletState } from '@suite-native/trading-fixtures';
import type { ProviderConfirmationStatus } from '@suite-native/trading-types';

import { SellFeePickerCard, type SellFeePickerCardProps } from '../SellFeePickerCard';

// Mock FeeSelector to avoid deep dependency chain
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSelector: jest.fn(() => null),
}));

describe('SellFeePickerCard', () => {
    const renderSellFeePickerCard = (
        props: Partial<SellFeePickerCardProps> = {},
        tradingAccountKey = 'eth-account-1',
        providerConfirmationStatus: ProviderConfirmationStatus = 'confirmation_success',
    ) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.sell!.tradingAccountKey = tradingAccountKey;
        preloadedState.wallet!.trading!.providerConfirmationStatus = providerConfirmationStatus;

        return renderWithStoreProvider(<SellFeePickerCard isTxnError={false} {...props} />, {
            preloadedState,
        });
    };

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
            'unknown-account-key',
        );

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when providerConfirmationStatus is not in "confirmation_success" state', () => {
        const { toJSON } = renderSellFeePickerCard(
            { quote: banxaCreditCardSellQuote },
            'eth-account-1',
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
