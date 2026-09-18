import { isNetworkIconSymbol } from '@suite-common/icons/src/iconUtils';

import type { NetworkParams } from '../NetworkParams';
import { NetworkIcon } from '../components/NetworkIcon/NetworkIcon';
import { NativeTokenIcon } from '../components/TokenIcon/NativeTokenIcon';
import type { TokenIconSize } from '../components/TokenIcon/tokenIconTypes';

type GetNetworkOptionsParams<TSymbol extends string> = NetworkParams<TSymbol> & {
    iconSize: TokenIconSize;
};

export const getNetworkOptions = <TSymbol extends string>({
    networks,
    networkNamesMap,
    iconSize,
    isToken = false,
}: GetNetworkOptionsParams<TSymbol>) =>
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
