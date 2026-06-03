import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { btc1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import {
    ExchangeToAccountTradePreviewCard,
    type ExchangeToAccountTradePreviewCardProps,
} from '../ExchangeToAccountTradePreviewCard';

describe('ExchangeToAccountTradePreviewCard', () => {
    const renderExchangeToAccountTradePreviewCard = (
        props: Partial<ExchangeToAccountTradePreviewCardProps> = {},
        receiveAccountKey = btc1NormalAccount.key,
    ) =>
        renderWithTradingProvider(<ExchangeToAccountTradePreviewCard {...props} />, {
            tradeType: 'exchange',
            overrides: {
                wallet: {
                    trading: {
                        composedTransactionInfo: {
                            composed: {
                                fee: '1000',
                                feePerByte: '1',
                                feeLimit: '21000',
                                estimatedFeeLimit: '21000',
                            },
                        },
                        exchange: { receiveAccountKey },
                    },
                },
            },
        });

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderExchangeToAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderExchangeToAccountTradePreviewCard(
            { quote: mercuryoFixedWorstQuote },
            mockAccountKey({ descriptor: 'unknownAccountKey' }),
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradeSideCard otherwise', () => {
        const { getByText } = renderExchangeToAccountTradePreviewCard({
            quote: mercuryoFixedWorstQuote,
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.toAccount')),
        ).toBeOnTheScreen();
        expect(getByText('+0.00083554 BTC')).toBeOnTheScreen();
        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText(`0.00083554-${mercuryoFixedWorstQuote.receive}`)).toBeOnTheScreen();
    });
});
