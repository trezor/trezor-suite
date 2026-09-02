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
    const renderSellCompletionFeeInfo = async (
        props: Partial<SellCompletionFeeInfoProps> = {},
        tradingAccountKey: AccountKey = eth1NormalAccount.key,
        providerConfirmationStatus: ProviderConfirmationStatus = 'confirmation_success',
    ) =>
        await renderWithTradingProvider(<SellCompletionFeeInfo isTxnError={false} {...props} />, {
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

    it('should render nothing when isTxnError', async () => {
        const { toJSON } = await renderSellCompletionFeeInfo({
            quote: banxaCreditCardSellQuote,
            isTxnError: true,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when there is no quote', async () => {
        const { toJSON } = await renderSellCompletionFeeInfo({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when quote has no cryptoCurrency', async () => {
        const quoteWithoutCrypto = {
            ...banxaCreditCardSellQuote,
            cryptoCurrency: undefined,
        };
        const { toJSON } = await renderSellCompletionFeeInfo({ quote: quoteWithoutCrypto });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', async () => {
        const { toJSON } = await renderSellCompletionFeeInfo(
            { quote: banxaCreditCardSellQuote },
            mockAccountKey({ descriptor: 'unknownAccountKey' }),
        );

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when providerConfirmationStatus is not in "confirmation_success" state', async () => {
        const { toJSON } = await renderSellCompletionFeeInfo(
            { quote: banxaCreditCardSellQuote },
            eth1NormalAccount.key,
            'window_closed_with_success',
        );

        expect(toJSON()).toBeNull();
    });

    it('should render fee info otherwise', async () => {
        const { getByTestId } = await renderSellCompletionFeeInfo({
            quote: banxaCreditCardSellQuote,
        });

        expect(getByTestId('fee-info-row')).toBeOnTheScreen();
    });
});
