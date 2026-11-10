import { TokenMetadataProvider } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TokenSymbol } from './TokenSymbol';

const networkSymbol = asNetworkSymbol('eth');
const contractAddress = toTokenAddress('0x' + '1'.repeat(40));

const renderTokenSymbol = (symbol?: string) =>
    renderWithStoreProvider(
        <TokenMetadataProvider
            sources={[{ networkSymbol, tokens: [{ contract: contractAddress, symbol }] }]}
        >
            <TokenSymbol
                isTruncated
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
            />
        </TokenMetadataProvider>,
    );

describe('TokenSymbol', () => {
    it('masks a URL symbol of an unrecognized token instead of truncating it', async () => {
        const { getByLabelText, queryByText } = await renderTokenSymbol('scamsite.io');

        expect(getByLabelText('…')).toBeOnTheScreen();
        expect(queryByText(/SCAMSITE\.I\.\.\./)).toBeNull();
    });

    it('truncates a long symbol without a URL', async () => {
        const { getByText } = await renderTokenSymbol('LONGTOKENSYMBOL');

        expect(getByText('LONGTOKENS...')).toBeOnTheScreen();
    });

    it('labels a token without a symbol as unknown', async () => {
        const { getByText } = await renderTokenSymbol();

        expect(getByText('Unknown token')).toBeOnTheScreen();
    });
});
