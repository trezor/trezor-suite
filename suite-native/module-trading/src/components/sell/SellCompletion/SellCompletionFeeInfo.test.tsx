import { type AccountKey } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { banxaCreditCardSellQuote, eth1NormalAccount } from '@suite-native/trading-fixtures';
import type { ProviderConfirmationStatus } from '@suite-native/trading-types';

import { SellCompletionFeeInfo, type SellCompletionFeeInfoProps } from './SellCompletionFeeInfo';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

jest.mock('../../general/TradeInfo/TradeFeeInfoRow', () => {
    const { View } = jest.requireActual('react-native');

    return { TradeFeeInfoRow: () => <View testID="fee-info-row" /> };
});

describe('SellCompletionFeeInfo', () => {
    const renderSellCompletionFeeInfo = (
        props: Partial<SellCompletionFeeInfoProps> = {},
        tradingAccountKey: AccountKey = eth1NormalAccount.key,
        providerConfirmationStatus: ProviderConfirmationStatus = 'confirmation_success',
    ) =>
        renderWithTradingProvider(<SellCompletionFeeInfo isTxnError={false} {...props} />, {
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
        const { toJSON } = renderSellCompletionFeeInfo({
            quote: banxaCreditCardSellQuote,
            isTxnError: true,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderSellCompletionFeeInfo({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no cryptoCurrency', () => {
        const quoteWithoutCrypto = {
            ...banxaCreditCardSellQuote,
            cryptoCurrency: undefined,
        };
        const { toJSON } = renderSellCompletionFeeInfo({ quote: quoteWithoutCrypto });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderSellCompletionFeeInfo(
            { quote: banxaCreditCardSellQuote },
            mockAccountKey({ descriptor: 'unknownAccountKey' }),
        );

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when providerConfirmationStatus is not in "confirmation_success" state', () => {
        const { toJSON } = renderSellCompletionFeeInfo(
            { quote: banxaCreditCardSellQuote },
            eth1NormalAccount.key,
            'window_closed_with_success',
        );

        expect(toJSON()).toBeNull();
    });

    it('should render fee info otherwise', () => {
        const { getByTestId } = renderSellCompletionFeeInfo({
            quote: banxaCreditCardSellQuote,
        });

        expect(getByTestId('fee-info-row')).toBeOnTheScreen();
    });
});
