import { useSelector } from 'react-redux';

import { TokenSymbol } from '@suite/token';
import { type NetworksRootState, selectNetworkDisplaySymbol } from '@suite-common/networks';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';

type AssetSymbolProps = {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    isTruncated?: boolean;
};

/** The symbol of a coin or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetSymbol = ({ networkSymbol, contractAddress, isTruncated }: AssetSymbolProps) => {
    const networkDisplaySymbol = useSelector((state: NetworksRootState) =>
        selectNetworkDisplaySymbol(state, networkSymbol),
    );

    if (contractAddress) {
        return (
            <TokenSymbol
                networkSymbol={networkSymbol}
                tokenContract={contractAddress}
                isTruncated={isTruncated}
            />
        );
    }

    return networkDisplaySymbol ?? null;
};
