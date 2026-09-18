import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { isNetworkIconSymbol } from '@suite-common/icons/src/iconUtils';
import { selectNetworkNamesMap } from '@suite-common/networks/reduxState/networksSelectors';
import { NetworkIcon } from '@trezor/product-components/src/components/NetworkIcon/NetworkIcon';
import { TokenIcon } from '@trezor/product-components/src/components/TokenIcon/TokenIcon';
import type {
    TokenIconProps,
    TokenIconSize,
} from '@trezor/product-components/src/components/TokenIcon/tokenIconTypes';

type UseNetworkParamsParams = {
    symbols: readonly TokenIconProps['symbol'][];
    iconSize: TokenIconSize;
    iconType: 'network' | 'token';
};

export const useNetworkParams = ({ symbols, iconSize, iconType }: UseNetworkParamsParams) => {
    const networkNamesMap = useSelector(selectNetworkNamesMap);

    return useMemo(
        () =>
            symbols.map(symbol => ({
                symbol,
                name: networkNamesMap?.[symbol] ?? symbol,
                icon:
                    iconType === 'network' && isNetworkIconSymbol(symbol) ? (
                        <NetworkIcon size={iconSize} networkSymbol={symbol} />
                    ) : (
                        <TokenIcon size={iconSize} symbol={symbol} />
                    ),
            })),
        [symbols, networkNamesMap, iconSize, iconType],
    );
};
