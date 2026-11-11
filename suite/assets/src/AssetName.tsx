import { TokenName } from '@suite/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { NativeTokenName } from './NativeTokenName';

type AssetNameProps = {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
};

/** The name of a native token or a token; an unrecognized token's name has its URLs masked. */
export const AssetName = ({ networkSymbol, contractAddress }: AssetNameProps) =>
    contractAddress ? (
        <TokenName networkSymbol={networkSymbol} tokenContract={contractAddress} />
    ) : (
        <NativeTokenName networkSymbol={networkSymbol} />
    );
