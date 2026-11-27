import { type CustomEvmNetworkDefinition } from '@suite-common/wallet-types';
import { EVM_NATIVE_CURRENCY_DECIMALS } from '@trezor/network-ethereum-suite-common';

export type BuildChainCatalogueParams = {
    excludedChainIds: Iterable<number>;
    includeTestnets: boolean;
};

export type UnsupportedCustomNetworkReason =
    | { type: 'nativeCurrencyDecimals'; decimals: number }
    | { type: 'noRpcUrl' }
    | { type: 'noExplorerUrl' };

/** A network the picker offers. A row with `unsupportedReason` is listed but cannot be added. */
export type CustomNetworkCatalogueEntry = {
    definition: CustomEvmNetworkDefinition;
    unsupportedReason?: UnsupportedCustomNetworkReason;
};

type GetUnsupportedReasonParams = {
    nativeCurrencyDecimals: number;
    rpcUrlCount: number;
    hasExplorerUrl: boolean;
};

// A network with both problems reports the decimals, which no RPC URL would fix.
export const getUnsupportedReason = ({
    nativeCurrencyDecimals,
    rpcUrlCount,
    hasExplorerUrl,
}: GetUnsupportedReasonParams): UnsupportedCustomNetworkReason | undefined => {
    // Every custom network is built with these decimals, so any other precision would show wrong amounts.
    if (nativeCurrencyDecimals !== EVM_NATIVE_CURRENCY_DECIMALS) {
        return { type: 'nativeCurrencyDecimals', decimals: nativeCurrencyDecimals };
    }

    if (rpcUrlCount === 0) {
        return { type: 'noRpcUrl' };
    }

    // Transaction and address links are built from it, so a custom network cannot be built without one.
    if (!hasExplorerUrl) {
        return { type: 'noExplorerUrl' };
    }

    return undefined;
};

/** Networks the user can add first, each group by name. */
export const compareCatalogueEntries = (
    first: CustomNetworkCatalogueEntry,
    second: CustomNetworkCatalogueEntry,
) =>
    Number(first.unsupportedReason !== undefined) -
        Number(second.unsupportedReason !== undefined) ||
    first.definition.name.localeCompare(second.definition.name);
