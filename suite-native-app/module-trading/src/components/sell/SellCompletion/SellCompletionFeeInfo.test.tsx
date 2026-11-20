import { type AccountKey } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { banxaCreditCardSellQuote, eth1NormalAccount } from '@suite-native/trading-fixtures';

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
    ) =>
        renderWithTradingProvider(<SellCompletionFeeInfo {...props} />, {
            tradeType: 'sell',
            overrides: {
                wallet: {
                    trading: {
                        sell: { tradingAccountKey },
                    },
                },
            },
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

    it('should render fee info otherwise', async () => {
        const { getByTestId } = await renderSellCompletionFeeInfo({
            quote: banxaCreditCardSellQuote,
        });

        expect(getByTestId('fee-info-row')).toBeOnTheScreen();
    });
});
