import { useSelector } from 'react-redux';

import { TokenSymbol } from '@suite/token';
import { type AssetId, parseAssetId } from '@suite-common/asset-types';
import { type NetworksRootState, selectNetworkDisplaySymbol } from '@suite-common/networks';

type AssetSymbolProps = {
    assetId: AssetId;
    isTruncated?: boolean;
};

/** The symbol of a coin or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetSymbol = ({ assetId, isTruncated }: AssetSymbolProps) => {
    const { networkSymbol, contractAddress } = parseAssetId(assetId);
    const networkDisplaySymbol = useSelector((state: NetworksRootState) =>
        selectNetworkDisplaySymbol(state, networkSymbol),
    );

    return contractAddress ? (
        <TokenSymbol
            networkSymbol={networkSymbol}
            tokenContract={contractAddress}
            isTruncated={isTruncated}
        />
    ) : (
        (networkDisplaySymbol ?? null)
    );
};
