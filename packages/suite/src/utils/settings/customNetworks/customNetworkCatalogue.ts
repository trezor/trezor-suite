import { type CustomEvmNetworkDefinition } from '@suite-common/wallet-types';
import { EVM_NATIVE_CURRENCY_DECIMALS } from '@trezor/network-ethereum-suite-common';

export type BuildChainCatalogueParams = {
    excludedChainIds: Iterable<number>;
    includeTestnets: boolean;
};

export type UnsupportedCustomNetworkReason =
    { type: 'nativeCurrencyDecimals'; decimals: number } | { type: 'noRpcUrl' };

/**
 * A network the picker offers. Only `definition` is stored when the network is added; the rest
 * only labels the row. A row with `unsupportedReason` is listed but cannot be added.
 */
export type CustomNetworkCatalogueEntry = {
    definition: CustomEvmNetworkDefinition;
    iconUrl?: string;
    mayClearSign: boolean;
    simulationSupport: boolean;
    unsupportedReason?: UnsupportedCustomNetworkReason;
};

type GetUnsupportedReasonParams = {
    nativeCurrencyDecimals: number;
    rpcUrlCount: number;
};

// A network with both problems reports the decimals, which no RPC URL would fix.
export const getUnsupportedReason = ({
    nativeCurrencyDecimals,
    rpcUrlCount,
}: GetUnsupportedReasonParams): UnsupportedCustomNetworkReason | undefined => {
    // Every custom network is built with these decimals, so any other precision would show wrong amounts.
    if (nativeCurrencyDecimals !== EVM_NATIVE_CURRENCY_DECIMALS) {
        return { type: 'nativeCurrencyDecimals', decimals: nativeCurrencyDecimals };
    }

    if (rpcUrlCount === 0) {
        return { type: 'noRpcUrl' };
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

// The EVM networks service vets only the networks CoinGecko knows; the rest is community data.
export const isCatalogueEntryVetted = ({ definition }: CustomNetworkCatalogueEntry) =>
    definition.coingeckoId !== undefined;
