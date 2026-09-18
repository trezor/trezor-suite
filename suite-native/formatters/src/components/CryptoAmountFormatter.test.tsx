import { asNetworkSymbol } from '@suite-common/wallet-config';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { CryptoAmountFormatter } from './CryptoAmountFormatter';

jest.mock('@suite-common/discreet-mode', () => ({
    useDiscreetMode: () => ({
        isDiscreetMode: false,
    }),
}));

describe('CryptoAmountFormatter', () => {
    const ethSymbol = asNetworkSymbol('eth');

    it('renders exact network amount by default', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CryptoAmountFormatter value="1.239" symbol={ethSymbol} />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('1.239 ETH');
    });

    it('renders compact network amount', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CryptoAmountFormatter
                value="1.239"
                symbol={ethSymbol}
                formatStyle="compact-balance"
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('1.23 ETH');
    });

    it('converts a network amount supplied in smallest units', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <CryptoAmountFormatter
                value="1239000000000000000"
                symbol={ethSymbol}
                valueUnit="smallest"
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('1.239 ETH');
    });
});
