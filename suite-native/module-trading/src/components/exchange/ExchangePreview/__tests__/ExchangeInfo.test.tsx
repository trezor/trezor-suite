import { Text } from 'react-native';

import { type AccountKey } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { btc1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import { ExchangeInfo, type ExchangeInfoProps } from '../ExchangeInfo';

// Mock FeeSelector to avoid deep dependency chain
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSelector: jest.fn(() => null),
}));

describe('ExchangeInfo', () => {
    const renderExchangeInfo = (
        props: Partial<ExchangeInfoProps> = {},
        tradingAccountKey: AccountKey = btc1NormalAccount.key,
    ) =>
        renderWithTradingProvider(<ExchangeInfo isTxnError={false} {...props} />, {
            tradeType: 'exchange',
            overrides: {
                wallet: { trading: { exchange: { tradingAccountKey } } },
            },
        });

    it('should render nothing when isTxnError', () => {
        const { toJSON } = renderExchangeInfo({
            quote: mercuryoFixedWorstQuote,
            isTxnError: true,
        });

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when there is no quote', () => {
        const { toJSON } = renderExchangeInfo({});

        expect(toJSON()).toBeNull();
    });

    it('should render nothing when account is not found', () => {
        const { toJSON } = renderExchangeInfo(
            { quote: mercuryoFixedWorstQuote },
            mockAccountKey({ descriptor: 'unknownAccountKey' }),
        );

        expect(toJSON()).toBeNull();
    });

    it('should render TradeInfo otherwise', () => {
        const { getByText } = renderExchangeInfo({ quote: mercuryoFixedWorstQuote });

        // 1st line of trade info is provider
        expect(getByText(getTranslation('moduleTrading.tradingScreen.provider'))).toBeOnTheScreen();
    });

    it('should render children inside TradeInfo', () => {
        const { getByText } = renderExchangeInfo({
            quote: mercuryoFixedWorstQuote,
            children: <Text>child content</Text>,
        });

        expect(getByText('child content')).toBeOnTheScreen();
    });
});
