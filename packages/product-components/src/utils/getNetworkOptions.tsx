import { isNetworkIconSymbol } from '@suite-common/icons';

import { NetworkIcon } from '../components/NetworkIcon/NetworkIcon';
import { NativeTokenIcon } from '../components/TokenIcon/NativeTokenIcon';
import type { TokenIconSize } from '../components/TokenIcon/tokenIconTypes';
import type { NetworkOption } from '../network-display/NetworkDisplayConfig';

type GetNetworkOptionsParams = {
    networks: readonly NetworkOption[];
    isToken?: boolean;
    iconSize: TokenIconSize;
};

export const getNetworkOptions = ({
    networks,
    iconSize,
    isToken = false,
}: GetNetworkOptionsParams) =>
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
