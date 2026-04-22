import { renderWithProviders } from '@suite-native/test-utils';
import { btcAsset } from '@suite-native/trading-fixtures';

import { TradeDetailAmountStack } from '../TradeDetailAmountStack';

describe('TradeDetailAmountStack', () => {
    it('should render fiat amount without crypto icon and fiat badge', () => {
        const { getByText, queryByText } = renderWithProviders(
            <TradeDetailAmountStack
                isCrypto={false}
                amountString="$100.00"
                amountValue="0.002"
                currency="USD"
            />,
            { providers: ['intl'] },
        );

        expect(getByText('$100.00')).toBeOnTheScreen();
        expect(queryByText(/0.002/)).toBeNull();
    });

    it('should render crypto amount with fiat badge', () => {
        const { getByText } = renderWithProviders(
            <TradeDetailAmountStack
                isCrypto={true}
                amountString="0.5 BTC"
                amountValue="0.5"
                currency="bitcoin"
            />,
            { providers: ['intl'] },
        );

        expect(getByText('0.5 BTC')).toBeOnTheScreen();
        expect(getByText(`0.5-${btcAsset.cryptoId}`)).toBeOnTheScreen();
    });
});
