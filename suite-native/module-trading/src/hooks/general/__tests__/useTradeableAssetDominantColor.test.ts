import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { renderHookWithProviders } from '@suite-native/test-utils';
import { useNativeStyles } from '@trezor/styles-native';
import { type CoinsColors, type Colors } from '@trezor/theme';

import { useTradeableAssetDominantColor } from '../useTradeableAssetDominantColor';

describe('useTradeableAssetDominantColor', () => {
    let colors: Colors;
    let coinsColors: CoinsColors;

    const renderTradeableAssetDominantColorHook = (
        givenSymbol: NetworkSymbol,
        givenContractAddress?: TokenAddress,
    ) =>
        renderHookWithProviders(
            ({
                symbol,
                contractAddress,
            }: {
                symbol: NetworkSymbol;
                contractAddress: TokenAddress | undefined;
            }) => useTradeableAssetDominantColor(symbol, contractAddress),
            {
                providers: ['intl'],
                initialProps: { symbol: givenSymbol, contractAddress: givenContractAddress },
            },
        );

    beforeAll(() => {
        const { result } = renderHookWithProviders(useNativeStyles, { providers: ['intl'] });
        ({ coinsColors, colors } = result.current.utils);
    });

    it('should return network color', () => {
        const { result } = renderTradeableAssetDominantColorHook('btc');

        expect(result.current).toBe(coinsColors.btc);
    });

    it('should fallback to legacyBackgroundNeutralBold for undefined networks', () => {
        const { result } = renderTradeableAssetDominantColorHook('und' as NetworkSymbol);

        expect(result.current).toBe(colors.legacyBackgroundNeutralBold);
    });
});
