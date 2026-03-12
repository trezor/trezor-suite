import { TokenSymbol } from '@suite-common/wallet-types';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { TokenAmountFormatter, TokenAmountFormatterProps } from '../TokenAmountFormatter';

describe('TokenAmountFormatter', () => {
    const renderTokenAmountFormatter = (props: Partial<TokenAmountFormatterProps>) =>
        renderWithStoreProviderAsync(
            <TokenAmountFormatter tokenSymbol={'USDC' as TokenSymbol} value="1234.56" {...props} />,
        );

    it('should render formatted value', async () => {
        const { getByTestId } = await renderTokenAmountFormatter({});

        expect(getByTestId('plain-text')).toHaveTextContent('1,234.56 USDC');
    });

    it('should render phishing transaction with empty value as discreet text', async () => {
        const { getByTestId } = await renderTokenAmountFormatter({
            value: '',
            isPhishingTransaction: true,
        });

        expect(getByTestId('discreet-text')).toHaveTextContent('0 USDC');
    });
});
