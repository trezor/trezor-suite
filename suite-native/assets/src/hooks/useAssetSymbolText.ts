import { useSelector } from 'react-redux';

import { type NetworksRootState, selectNetworkDisplaySymbol } from '@suite-common/networks';
import { getTokenDisplaySymbol, useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';

/**
 * The symbol of a coin or a token as plain text, for labels that style their own text, such as a
 * `Button`; an `AssetSymbol` nested there would override the label's colour and size.
 * Unlike `AssetSymbol`, URLs in an unrecognized token's symbol are not masked.
 */
export const useAssetSymbolText = (
    networkSymbol: NetworkSymbol,
    contractAddress?: TokenAddress,
) => {
    const networkDisplaySymbol = useSelector((state: NetworksRootState) =>
        selectNetworkDisplaySymbol(state, networkSymbol),
    );
    const token = useTokenMetadata(networkSymbol, contractAddress);

    return contractAddress ? (getTokenDisplaySymbol(token) ?? '') : (networkDisplaySymbol ?? '');
};
