import { type TokenSymbol } from '@suite-common/wallet-types';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TokenAmountFormatter, type TokenAmountFormatterProps } from '../TokenAmountFormatter';

describe('TokenAmountFormatter', () => {
    const renderTokenAmountFormatter = (props: Partial<TokenAmountFormatterProps>) =>
        renderWithStoreProvider(
            <TokenAmountFormatter tokenSymbol={'USDC' as TokenSymbol} value="1234.56" {...props} />,
        );

    it('should render formatted value', () => {
        const { getByTestId } = renderTokenAmountFormatter({});

        expect(getByTestId('plain-text')).toHaveTextContent('1,234.56 USDC');
    });

    it('should render phishing transaction with empty value as discreet text', () => {
        const { getByTestId } = renderTokenAmountFormatter({
            value: '',
            isPhishingTransaction: true,
        });

        expect(getByTestId('discreet-text')).toHaveTextContent('0 USDC');
    });
});
