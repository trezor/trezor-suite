import type { CryptoId } from 'invity-api';

import { Text as MockText } from '@suite-native/atoms';
import { renderWithBasicProvider } from '@suite-native/test-utils';
import { btcAsset } from '@suite-native/trading-fixtures';

import { TradeDetailAmountStack } from '../TradeDetailAmountStack';

jest.mock('../../../general/CryptoToFiatValueBadge', () => ({
    CryptoToFiatValueBadge: ({
        prefix,
        amount,
        cryptoId,
    }: {
        prefix?: string;
        amount?: string;
        cryptoId?: CryptoId;
    }) => (
        <MockText>
            {prefix}-{amount}-{cryptoId}
        </MockText>
    ),
}));

describe('TradeDetailAmountStack', () => {
    it('should render fiat amount without crypto icon and fiat badge', () => {
        const { getByText, queryByText } = renderWithBasicProvider(
            <TradeDetailAmountStack
                isCrypto={false}
                amountString="$100.00"
                amountValue="0.002"
                currency="USD"
            />,
        );

        expect(getByText('$100.00')).toBeOnTheScreen();
        expect(queryByText(/0.002/)).toBeNull();
    });

    it('should render crypto amount with fiat badge', () => {
        const { getByText } = renderWithBasicProvider(
            <TradeDetailAmountStack
                isCrypto={true}
                amountString="0.5 BTC"
                amountValue="0.5"
                currency="bitcoin"
            />,
        );

        expect(getByText('0.5 BTC')).toBeOnTheScreen();
        expect(getByText(`≈ -0.5-${btcAsset.cryptoId}`)).toBeOnTheScreen();
    });
});
