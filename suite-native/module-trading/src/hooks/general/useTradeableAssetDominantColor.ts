import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { useNativeStyles } from '@trezor/styles';

export const useTradeableAssetDominantColor = (
    symbol: NetworkSymbol,
    _contractAddress?: TokenAddress,
) => {
    const {
        utils: { colors, coinsColors },
    } = useNativeStyles();

    const defaultColor = colors.backgroundNeutralBold;
    const networkColor = coinsColors[symbol];

    return networkColor ?? defaultColor;
};
