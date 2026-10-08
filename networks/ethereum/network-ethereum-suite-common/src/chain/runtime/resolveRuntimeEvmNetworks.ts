import {
    type RuntimeNetworkKey,
    type RuntimeNetworkPreferences,
    getRuntimeNetworkKey,
} from '@trezor/network-module-suite-common-types';

import {
    type RuntimeEvmNetworkDefinition,
    type RuntimeEvmNetworkSource,
    validateRuntimeEvmNetworkDefinition,
} from './RuntimeEvmNetworkDefinition';

/** Symbols and chain IDs taken: no runtime network may reuse them. */
export type RuntimeEvmNetworkReservations = {
    readonly reservedSymbols: ReadonlySet<string>;
    readonly reservedChainIds: ReadonlySet<number>;
};

export type RuntimeEvmNetwork = {
    readonly definition: RuntimeEvmNetworkDefinition;
    readonly key: RuntimeNetworkKey;
    readonly isEnabled: boolean;
};

export type RuntimeEvmNetworkResolution = {
    readonly networks: readonly RuntimeEvmNetwork[];

    /** The user's definitions that are not used: a Trezor-listed one has their symbol or chain ID. */
    readonly shadowedUserDefinitions: readonly RuntimeEvmNetworkDefinition[];

    /** What a network the user adds may not take: built-in and runtime symbols and chain IDs. */
    readonly reservations: RuntimeEvmNetworkReservations;
};

export type ResolveRuntimeEvmNetworksParams = {
    /** Entries of Trezor's signed list, unchecked. */
    trezorListed: readonly unknown[];
    preferences: RuntimeNetworkPreferences;

    /** What the networks built into the app take. */
    builtIn: RuntimeEvmNetworkReservations;
};

const toDefinitions = (
    entries: readonly unknown[],
    source: RuntimeEvmNetworkSource,
    builtIn: RuntimeEvmNetworkReservations,
) =>
    entries.flatMap(entry => {
        const result = validateRuntimeEvmNetworkDefinition(entry, { source, ...builtIn });

        return result.success ? [result.definition] : [];
    });

/**
 * The runtime EVM networks from Trezor's list and the user's preferences. Every entry is checked on
 * every read, so a symbol or chain ID a later release builds in drops the entry. Trezor's entries
 * win over the user's, and the first entry over a later one with the same symbol or chain ID.
 */
export const resolveRuntimeEvmNetworks = ({
    trezorListed,
    preferences,
    builtIn,
}: ResolveRuntimeEvmNetworksParams): RuntimeEvmNetworkResolution => {
    const symbols = new Set<string>();
    const chainIds = new Set<number>();
    const networks: RuntimeEvmNetwork[] = [];
    const shadowedUserDefinitions: RuntimeEvmNetworkDefinition[] = [];
    const enabled = new Set(preferences.enabled);

    [
        ...toDefinitions(trezorListed, 'trezor', builtIn),
        ...toDefinitions(preferences.userDefinitions, 'user', builtIn),
    ].forEach(definition => {
        if (symbols.has(definition.symbol) || chainIds.has(definition.chainId)) {
            if (definition.source === 'user') shadowedUserDefinitions.push(definition);

            return;
        }
        symbols.add(definition.symbol);
        chainIds.add(definition.chainId);

        const key = getRuntimeNetworkKey(definition.source, definition.symbol);
        networks.push({ definition, key, isEnabled: enabled.has(key) });
    });

    return {
        networks,
        shadowedUserDefinitions,
        reservations: {
            reservedSymbols: new Set([...builtIn.reservedSymbols, ...symbols]),
            reservedChainIds: new Set([...builtIn.reservedChainIds, ...chainIds]),
        },
    };
};
