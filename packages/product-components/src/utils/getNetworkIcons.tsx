import { isNetworkIconSymbol } from '@suite-common/icons';

import { NetworkIcon } from '../components/NetworkIcon/NetworkIcon';
import { NativeTokenIcon } from '../components/TokenIcon/NativeTokenIcon';
import type { TokenIconSize } from '../components/TokenIcon/tokenIconTypes';
import type { NetworkConfig } from '../network-display/NetworkConfig';

type GetNetworkIconsParams = {
    networks: readonly NetworkConfig[];
    isToken?: boolean;
    iconSize: TokenIconSize;
};

export const getNetworkIcons = ({ networks, iconSize, isToken = false }: GetNetworkIconsParams) =>
    networks.map(({ symbol, name }) => ({
        symbol,
        name,
        icon:
            !isToken && isNetworkIconSymbol(symbol) ? (
                <NetworkIcon size={iconSize} networkSymbol={symbol} />
            ) : (
                <NativeTokenIcon size={iconSize} symbol={symbol} />
            ),
    }));
