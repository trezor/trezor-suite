import { TokenSymbol } from '@suite/token';
import { type AssetId } from '@suite-common/tokens';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';

type AssetSymbolProps = AssetId & {
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
