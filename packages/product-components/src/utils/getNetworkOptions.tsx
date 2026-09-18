import { isNetworkIconSymbol } from '@suite-common/icons/src/iconUtils';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import type { NetworkParams } from '../NetworkParams';
import { NetworkIcon } from '../components/NetworkIcon/NetworkIcon';
import { TokenIcon } from '../components/TokenIcon/TokenIcon';
import type { TokenIconSize } from '../components/TokenIcon/tokenIconTypes';

type GetNetworkOptionsParams<TSymbol extends NetworkSymbol> = NetworkParams<TSymbol> & {
    iconSize: TokenIconSize;
};

export const getNetworkOptions = <TSymbol extends NetworkSymbol>({
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
                <TokenIcon size={iconSize} symbol={symbol} />
            ),
    }));
