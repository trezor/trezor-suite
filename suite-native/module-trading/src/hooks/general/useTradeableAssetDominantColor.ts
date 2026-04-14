import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { useNativeStyles } from '@trezor/styles-native';

export const useTradeableAssetDominantColor = (
    symbol: NetworkSymbol,
    _contractAddress?: TokenAddress,
) => {
    const {
        utils: { colors, coinsColors },
    } = useNativeStyles();

    const defaultColor = colors.legacyBackgroundNeutralBold;
    const networkColor = coinsColors[symbol];

    return networkColor ?? defaultColor;
};
