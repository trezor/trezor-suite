import { TokenSymbol } from '@suite/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';

type AssetSymbolProps = {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    isTruncated?: boolean;
};

/** The symbol of a coin or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetSymbol = ({ networkSymbol, contractAddress, isTruncated }: AssetSymbolProps) =>
    contractAddress ? (
        <TokenSymbol
            networkSymbol={networkSymbol}
            tokenContract={contractAddress}
            isTruncated={isTruncated}
        />
    ) : (
        getNetworkDisplaySymbol(networkSymbol)
    );
