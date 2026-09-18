import { isNetworkIconSymbol } from '@suite-common/icons/src/iconUtils';

import type { NetworkParams } from '../NetworkParams';
import { NetworkIcon } from '../components/NetworkIcon/NetworkIcon';
import { NativeTokenIcon } from '../components/TokenIcon/NativeTokenIcon';
import type { TokenIconSize } from '../components/TokenIcon/tokenIconTypes';

type GetNetworkOptionsParams = NetworkParams & {
    iconSize: TokenIconSize;
};

export const getNetworkOptions = ({
    networks,
    networkNamesMap,
    iconSize,
    isToken = false,
}: GetNetworkOptionsParams) =>
    networks.map(symbol => ({
        symbol,
        name: networkNamesMap?.[symbol] ?? symbol,
        icon:
            !isToken && isNetworkIconSymbol(symbol) ? (
                <NetworkIcon size={iconSize} networkSymbol={symbol} />
            ) : (
                <NativeTokenIcon size={iconSize} symbol={symbol} />
            ),
    }));
