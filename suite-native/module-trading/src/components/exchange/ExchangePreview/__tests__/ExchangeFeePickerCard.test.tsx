import { type AccountKey } from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';
import { btc1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import { ExchangeFeePickerCard, type ExchangeFeePickerCardProps } from '../ExchangeFeePickerCard';

// Mock FeeSelector to avoid deep dependency chain
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSelector: jest.fn(() => null),
}));

describe('ExchangeFeePickerCard', () => {
    const renderExchangeFeePickerCard = (
        props: Partial<ExchangeFeePickerCardProps> = {},
        tradingAccountKey: AccountKey = btc1NormalAccount.key,
    ) =>
        renderWithTradingProvider(<ExchangeFeePickerCard isTxnError={false} {...props} />, {
            tradeType: 'exchange',
            overrides: {
                wallet: { trading: { exchange: { tradingAccountKey } } },
            },
        });

    it('should render nothing when isTxnError', () => {
        const { toJSON } = renderExchangeFeePickerCard({
            quote: mercuryoFixedWorstQuote,
            isTxnError: true,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderExchangeFeePickerCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderExchangeFeePickerCard(
            { quote: mercuryoFixedWorstQuote },
            'unknown-account-key' as AccountKey,
        );

        expect(toJSON()).toBeNull();
    });

    it('should render FeePickerCard otherwise', () => {
        const { getByText } = renderExchangeFeePickerCard({ quote: mercuryoFixedWorstQuote });

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.details')),
        ).toBeOnTheScreen();
    });
});
