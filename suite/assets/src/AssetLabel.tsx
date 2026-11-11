import { type ReactNode } from 'react';

import { TokenName } from '@suite/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, getAssetName } from '@suite-common/wallet-config';

type AssetLabelProps = {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    /** Shown for a token without metadata, e.g. a catalog token the user does not hold. */
    fallback?: ReactNode;
};

/** The name of a network's coin, or of a token with URLs masked when it is unrecognized. */
export const AssetLabel = ({ networkSymbol, contractAddress, fallback }: AssetLabelProps) => {
    if (!contractAddress) return getAssetName({ symbol: networkSymbol });

    return (
        <TokenName
            networkSymbol={networkSymbol}
            tokenContract={contractAddress}
            fallback={fallback}
        />
    );
};
