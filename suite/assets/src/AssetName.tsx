import { TokenName, maskUrls } from '@suite/token';
import { type NetworksRootState, selectNativeTokenName } from '@suite-common/networks';
import { selectTokenByNetworkAndContract } from '@suite-common/token';
import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState } from '@suite-common/wallet-core';

import { NativeTokenName } from './NativeTokenName';

type AssetNameTextRootState = AccountsRootState & NetworksRootState & TokenDefinitionsRootState;

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

/**
 * `AssetName` as plain text, for places that take only a string, such as the window title.
 * It reads the store only, not context metadata.
 */
export const selectAssetNameText = (
    state: AssetNameTextRootState,
    networkSymbol: NetworkSymbol,
    contractAddress?: TokenAddress,
): string | undefined => {
    if (!contractAddress) return selectNativeTokenName(state, networkSymbol);

    const token = selectTokenByNetworkAndContract(state, networkSymbol, contractAddress);
    const name = token?.name || token?.symbol;
    const isRecognized = selectIsSpecificCoinDefinitionKnown(state, networkSymbol, contractAddress);

    return name && !isRecognized ? maskUrls(name) : name;
};
