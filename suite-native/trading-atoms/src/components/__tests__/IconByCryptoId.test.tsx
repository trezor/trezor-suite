import { renderWithBasicProvider } from '@suite-native/test-utils';
import {
    btcAsset,
    ethOnBaseAsset,
    rethOnBaseAsset,
    usdcAsset,
} from '@suite-native/trading-fixtures';

import { IconByCryptoId } from '../IconByCryptoId';

describe('IconByCryptoId', () => {
    it('should render display symbol icon for native L1 asset', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <IconByCryptoId cryptoId={btcAsset.cryptoId} />,
        );

        expect(getByLabelText('BTC')).toBeTruthy();
    });

    it('should render ETH icon for native asset on L2 EVM network', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <IconByCryptoId cryptoId={ethOnBaseAsset.cryptoId} />,
        );

        expect(getByLabelText('ETH')).toBeTruthy();
    });

    it('should render token icon with contract address for ERC-20 token', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <IconByCryptoId cryptoId={usdcAsset.cryptoId} />,
        );

        expect(getByLabelText('eth0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBeTruthy();
    });

    it('should render token icon with contract address for token on L2 EVM network', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <IconByCryptoId cryptoId={rethOnBaseAsset.cryptoId} />,
        );

        expect(getByLabelText('base0xb6fe221fe9eef5aba221c348ba20a1bf5e73624c')).toBeTruthy();
    });
});
