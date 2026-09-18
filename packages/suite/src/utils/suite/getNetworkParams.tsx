import { isNetworkIconSymbol } from '@suite-common/icons/src/iconUtils';
import { NetworkIcon } from '@trezor/product-components/src/components/NetworkIcon/NetworkIcon';
import { TokenIcon } from '@trezor/product-components/src/components/TokenIcon/TokenIcon';
import type {
    TokenIconProps,
    TokenIconSize,
} from '@trezor/product-components/src/components/TokenIcon/tokenIconTypes';

type GetNetworkParamsParams = {
    symbols: readonly TokenIconProps['symbol'][];
    networkNamesMap: Record<TokenIconProps['symbol'], string> | null;
    iconSize: TokenIconSize;
    iconType: 'network' | 'token';
};

export const getNetworkParams = ({
    symbols,
    networkNamesMap,
    iconSize,
    iconType,
}: GetNetworkParamsParams) =>
    symbols.map(symbol => ({
        symbol,
        name: networkNamesMap?.[symbol] ?? symbol,
        icon:
            iconType === 'network' && isNetworkIconSymbol(symbol) ? (
                <NetworkIcon size={iconSize} networkSymbol={symbol} />
            ) : (
                <TokenIcon size={iconSize} symbol={symbol} />
            ),
    }));
