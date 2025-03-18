import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';
import { useNativeStyles } from '@trezor/styles';
import { CoinsColors, Colors } from '@trezor/theme';

import { useTradeableAssetDominantColor } from '../useTradeableAssetDominantColor';

describe('useTradeableAssetDominantColor', () => {
    let colors: Colors;
    let coinsColors: CoinsColors;

    const renderTradeableAssetDominantColorHook = (
        givenSymbol: NetworkSymbol,
        givenContractAddress?: TokenAddress,
    ) =>
        renderHookWithBasicProvider(
            ({
                symbol,
                contractAddress,
            }: {
                symbol: NetworkSymbol;
                contractAddress: TokenAddress | undefined;
            }) => useTradeableAssetDominantColor(symbol, contractAddress),
            {
                initialProps: { symbol: givenSymbol, contractAddress: givenContractAddress },
            },
        );

    beforeAll(() => {
        const { result } = renderHookWithBasicProvider(useNativeStyles);
        ({ coinsColors, colors } = result.current.utils);
    });

    it('should return network color', () => {
        const { result } = renderTradeableAssetDominantColorHook('btc');

        expect(result.current).toBe(coinsColors.btc);
    });

    it('should fallback to backgroundNeutralBold for undefined networks', () => {
        const { result } = renderTradeableAssetDominantColorHook('und' as NetworkSymbol);

        expect(result.current).toBe(colors.backgroundNeutralBold);
    });
});
