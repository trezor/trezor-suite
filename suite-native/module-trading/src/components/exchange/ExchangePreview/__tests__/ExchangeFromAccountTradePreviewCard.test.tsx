import type { AccountKey } from '@suite-common/wallet-types';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import {
    ExchangeFromAccountTradePreviewCard,
    type ExchangeFromAccountTradePreviewCardProps,
} from '../ExchangeFromAccountTradePreviewCard';

describe('ExchangeFromAccountTradePreviewCard', () => {
    const renderExchangeFromAccountTradePreviewCard = (
        props: Partial<ExchangeFromAccountTradePreviewCardProps> = {},
        tradingAccountKey = eth1NormalAccount.key,
    ) =>
        renderWithTradingProvider(<ExchangeFromAccountTradePreviewCard {...props} />, {
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
                        exchange: { tradingAccountKey },
                    },
                },
            },
            providers: ['intl', 'formatter'],
        });

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderExchangeFromAccountTradePreviewCard({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderExchangeFromAccountTradePreviewCard(
            { quote: mercuryoFixedWorstQuote },
            'unknown-account-key' as AccountKey,
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradeSideCard otherwise', () => {
        const { getByText } = renderExchangeFromAccountTradePreviewCard({
            quote: mercuryoFixedWorstQuote,
        });

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(getByText('-100 USDC')).toBeOnTheScreen();
        expect(getByText(`100-${mercuryoFixedWorstQuote.send}`)).toBeOnTheScreen();
    });

    it('should display correct account name', () => {
        const { getByText } = renderExchangeFromAccountTradePreviewCard({
            quote: mercuryoFixedWorstQuote,
        });
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
    });
});
