import { type AccountKey } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { banxaCreditCardSellQuote, eth1NormalAccount } from '@suite-native/trading-fixtures';
import type { ProviderConfirmationStatus } from '@suite-native/trading-types';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import { SellInfo, type SellInfoProps } from '../SellInfo';

// Mock FeeSelector to avoid deep dependency chain
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSelector: jest.fn(() => null),
}));

describe('SellInfo', () => {
    const renderSellInfo = (
        props: Partial<SellInfoProps> = {},
        tradingAccountKey: AccountKey = eth1NormalAccount.key,
        providerConfirmationStatus: ProviderConfirmationStatus = 'confirmation_success',
    ) =>
        renderWithTradingProvider(<SellInfo isTxnError={false} {...props} />, {
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
        const { toJSON } = renderSellInfo({
            quote: banxaCreditCardSellQuote,
            isTxnError: true,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderSellInfo({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no cryptoCurrency', () => {
        const quoteWithoutCrypto = {
            ...banxaCreditCardSellQuote,
            cryptoCurrency: undefined,
        };
        const { toJSON } = renderSellInfo({ quote: quoteWithoutCrypto });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderSellInfo(
            { quote: banxaCreditCardSellQuote },
            mockAccountKey({ descriptor: 'unknownAccountKey' }),
        );

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when providerConfirmationStatus is not in "confirmation_success" state', () => {
        const { toJSON } = renderSellInfo(
            { quote: banxaCreditCardSellQuote },
            eth1NormalAccount.key,
            'window_closed_with_success',
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradeInfo otherwise', () => {
        const { getByText } = renderSellInfo({ quote: banxaCreditCardSellQuote });

        // 1st line of trade info is provider
        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
    });
});
