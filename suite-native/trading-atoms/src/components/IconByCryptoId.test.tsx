import { act, renderWithBasicProvider } from '@suite-native/test-utils';
import {
    btcAsset,
    ethOnBaseAsset,
    rethOnBaseAsset,
    usdcAsset,
} from '@suite-native/trading-fixtures';

import { IconByCryptoId, type IconByCryptoIdProps } from './IconByCryptoId';

const tokenIconHint = 'Token Icon';
const networkIconHint = 'Network Icon';

describe('IconByCryptoId', () => {
    const renderIcon = async (props: IconByCryptoIdProps) => {
        const result = renderWithBasicProvider(<IconByCryptoId {...props} />);
        await act(async () => {});

        return result;
    };

    it('should render display symbol icon for native L1 asset', async () => {
        const { getByLabelText } = await renderIcon({ cryptoId: btcAsset.cryptoId });

        expect(getByLabelText('BTC')).toBeTruthy();
    });

    it('should render ETH icon for native asset on L2 EVM network', async () => {
        const { getByLabelText, queryByHintText } = await renderIcon({
            cryptoId: ethOnBaseAsset.cryptoId,
        });

        expect(getByLabelText('ETH')).toBeTruthy();
        expect(queryByHintText(networkIconHint)).toBeNull();
    });

    it('should render token icon with contract address for ERC-20 token', async () => {
        const { getByLabelText, queryByHintText } = await renderIcon({
            cryptoId: usdcAsset.cryptoId,
        });

        expect(getByLabelText('eth:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBeTruthy();
        expect(queryByHintText(networkIconHint)).toBeNull();
    });

    it('should render token icon with contract address for token on L2 EVM network', async () => {
        const { getByLabelText, queryByHintText } = await renderIcon({
            cryptoId: rethOnBaseAsset.cryptoId,
        });

        expect(getByLabelText('base:0xb6fe221fe9eef5aba221c348ba20a1bf5e73624c')).toBeTruthy();
        expect(queryByHintText(networkIconHint)).toBeNull();
    });

    it('should render nothing for unknown cryptoId', async () => {
        const { toJSON } = await renderIcon({ cryptoId: 'unknown' as any });

        expect(toJSON()).toBeNull();
    });

    describe('withNetwork', () => {
        it('should render L1 asset icon without network badge', async () => {
            const { getByLabelText, getByHintText, queryByHintText } = await renderIcon({
                cryptoId: btcAsset.cryptoId,
                withNetwork: true,
            });

            expect(getByHintText(tokenIconHint)).toBeTruthy();
            expect(getByLabelText('BTC')).toBeTruthy();
            expect(queryByHintText(networkIconHint)).toBeNull();
        });

        it('should render ETH icon with network badge for native asset on L2 EVM network', async () => {
            const { getByLabelText, getByHintText } = await renderIcon({
                cryptoId: ethOnBaseAsset.cryptoId,
                withNetwork: true,
            });

            expect(getByHintText(tokenIconHint)).toBeTruthy();
            expect(getByLabelText('ETH')).toBeTruthy();
            expect(getByHintText(networkIconHint)).toBeTruthy();
        });

        it('should render ERC-20 token icon with network badge', async () => {
            const { getByLabelText, getByHintText } = await renderIcon({
                cryptoId: usdcAsset.cryptoId,
                withNetwork: true,
            });

            expect(getByHintText(tokenIconHint)).toBeTruthy();
            expect(getByLabelText('eth:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBeTruthy();
            expect(getByHintText(networkIconHint)).toBeTruthy();
        });

        it('should render L2 EVM token icon with network badge', async () => {
            const { getByLabelText, getByHintText } = await renderIcon({
                cryptoId: rethOnBaseAsset.cryptoId,
                withNetwork: true,
            });

            expect(getByHintText(tokenIconHint)).toBeTruthy();
            expect(getByLabelText('base:0xb6fe221fe9eef5aba221c348ba20a1bf5e73624c')).toBeTruthy();
            expect(getByHintText(networkIconHint)).toBeTruthy();
        });
    });
});
