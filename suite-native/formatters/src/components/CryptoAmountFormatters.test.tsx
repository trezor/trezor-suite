import { asNetworkSymbol } from '@suite-common/wallet-config';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { CompactCryptoAmountFormatter } from './CompactCryptoAmountFormatter';
import { ExactCryptoAmountFormatter } from './ExactCryptoAmountFormatter';

jest.mock('@suite-common/discreet-mode', () => ({
    useDiscreetMode: () => ({
        isDiscreetMode: false,
    }),
}));

describe('Crypto amount formatters', () => {
    const ethSymbol = asNetworkSymbol('eth');

    it('renders exact value', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <ExactCryptoAmountFormatter value="1.239" symbol={ethSymbol} />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('1.239 ETH');
    });

    it('renders compact value with compact wrapper', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CompactCryptoAmountFormatter value="1.239" symbol={ethSymbol} />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('1.23 ETH');
    });
});
