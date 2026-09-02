import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';

jest.mock('@suite-common/discreet-mode', () => ({
    useDiscreetMode: () => ({
        isDiscreetMode: false,
    }),
}));

describe('AccountDetailCryptoValue', () => {
    it('renders exact token amount using token decimals', async () => {
        const { getByTestId } = await renderWithBasicProvider(
            <AccountDetailCryptoValue
                value="1000000"
                symbol={asNetworkSymbol('eth')}
                tokenSymbol={'USDC' as TokenSymbol}
                tokenDecimals={6}
            />,
        );

        expect(getByTestId('plain-text')).toHaveTextContent('1 USDC');
    });
});
