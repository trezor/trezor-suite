import type { NetworkIcon as NetworkIconContract } from '@trezor/network-assets-types';

import { NetworkIcon } from '../components/NetworkIcon/NetworkIcon';
import { NativeTokenIcon } from '../components/TokenIcon/NativeTokenIcon';
import type { TokenIconSize } from '../components/TokenIcon/tokenIconTypes';
import type { NetworkConfig } from '../network-display/NetworkConfig';

type GetNetworkIconsParams = {
    networks: readonly NetworkConfig[];
    isToken?: boolean;
    iconSize: TokenIconSize;
};

export type GetNetworkIconsDeps = Pick<NetworkIconContract, 'hasNetworkIcon'>;

export const getNetworkIcons = (
    deps: GetNetworkIconsDeps,
    { networks, iconSize, isToken = false }: GetNetworkIconsParams,
) =>
    networks.map(({ symbol, name }) => ({
        symbol,
        name,
        icon:
            !isToken && deps.hasNetworkIcon(symbol) ? (
                <NetworkIcon size={iconSize} networkSymbol={symbol} />
            ) : (
                <NativeTokenIcon size={iconSize} symbol={symbol} />
            ),
    }));
