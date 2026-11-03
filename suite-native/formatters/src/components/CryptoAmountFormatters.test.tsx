import { asNetworkSymbol } from '@suite-common/wallet-config';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { CompactCryptoAmountFormatter } from './CompactCryptoAmountFormatter';
import { ExactCryptoAmountFormatter } from './ExactCryptoAmountFormatter';

describe('Crypto amount formatters', () => {
    const ethSymbol = asNetworkSymbol('eth');

    it('renders exact value', async () => {
        const { getByText } = await renderWithStoreProvider(
            <ExactCryptoAmountFormatter value="1.239" symbol={ethSymbol} />,
        );

        expect(getByText('1.239 ETH')).toBeVisible();
    });

    it('renders an exact subunit amount without the symbol', async () => {
        const { getByText } = await renderWithStoreProvider(
            <ExactCryptoAmountFormatter
                value="1239000000000000001"
                symbol={ethSymbol}
                isBalance={false}
                withSymbol={false}
            />,
        );

        expect(getByText('1.239000000000000001')).toBeVisible();
    });

    it.each([
        ['positive', '+1.23 ETH'],
        ['negative', '-1.23 ETH'],
        [undefined, '1.23 ETH'],
    ] as const)('renders a native amount with %s direction', async (signValue, expected) => {
        const { getByText } = await renderWithStoreProvider(
            <CompactCryptoAmountFormatter value="1.239" symbol={ethSymbol} signValue={signValue} />,
        );

        expect(getByText(expected)).toBeVisible();
    });
});
