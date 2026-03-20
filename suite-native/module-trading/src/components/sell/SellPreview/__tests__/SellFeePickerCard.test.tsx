import { type PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { getWalletState, sellQuotes } from '@suite-native/trading-fixtures';
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

        return renderWithStoreProviderAsync(<SellFeePickerCard isTxnError={false} {...props} />, {
            preloadedState,
        });
    };

    it('should render nothing when isTxnError', async () => {
        const { toJSON } = await renderSellFeePickerCard({
            quote: sellQuotes[0],
            isTxnError: true,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when there is no quote', async () => {
        const { toJSON } = await renderSellFeePickerCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no cryptoCurrency', async () => {
        const quoteWithoutCrypto = {
            ...sellQuotes[0],
            cryptoCurrency: undefined,
        };
        const { toJSON } = await renderSellFeePickerCard({
            quote: quoteWithoutCrypto as (typeof sellQuotes)[0],
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', async () => {
        const { toJSON } = await renderSellFeePickerCard(
            { quote: sellQuotes[0] },
            'unknown-account-key',
        );

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when providerConfirmationStatus is not in "confirmation_success" state', async () => {
        const { toJSON } = await renderSellFeePickerCard(
            { quote: sellQuotes[0] },
            'eth-account-1',
            'window_closed_with_success',
        );

        expect(toJSON()).toBeNull();
    });

    it('should render FeePickerCard otherwise', async () => {
        const { getByText } = await renderSellFeePickerCard({ quote: sellQuotes[0] });

        expect(getByText('Transaction details')).toBeOnTheScreen();
    });
});
