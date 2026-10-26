import type { NetworkSymbol } from '@trezor/network-module-types';
import { isArrayMember } from '@trezor/utils';

import { type CapabilityRequirements, areRequirementsMet } from './CapabilityRequirements';
import type { NetworkContext } from './NetworkContext';
import type { SuiteCommonNetworkConfig } from '../SuiteCommonNetworkConfig';
import type { MessageSigning } from './messageSigning/MessageSigning';

/** What every capability is created from: one symbol, in one context, with its config. */
export type NetworkDescription<TSymbol extends string> = {
    readonly symbol: TSymbol;
    readonly context: NetworkContext<TSymbol>;
    readonly config: SuiteCommonNetworkConfig;
};

export type CapabilityProvider<TDeps, TSymbol extends string, TCapability> = {
    readonly requires: CapabilityRequirements;
    readonly create: (deps: TDeps, network: NetworkDescription<TSymbol>) => TCapability;
};

/**
 * Every capability contract the app knows how to consume, under the name it has on a network.
 * A family may provide any subset; one it provides under a known name must match the contract.
 */
export type OpenNetworkCapabilities = {
    readonly messageSigning?: MessageSigning;
};

/** Each capability a family provides, under the name it has on the network. */
export type CapabilityProviders<TDeps, TSymbol extends string, TCapabilities> = {
    readonly [Name in keyof TCapabilities]: CapabilityProvider<TDeps, TSymbol, TCapabilities[Name]>;
};

/** Present exactly when the provider's requirements hold for the network's context. */
export type NetworkCapabilities<TCapabilities> = {
    readonly [Name in keyof TCapabilities]?: TCapabilities[Name];
};

export type Network<
    TFamily extends string,
    TSymbol extends string,
    TCapabilities,
> = NetworkDescription<TSymbol> & {
    readonly family: TFamily;
    readonly capabilities: TCapabilities;
};

/** A network as the app sees it: open symbol, and only the capability contracts it knows. */
export type OpenNetwork = Network<string, NetworkSymbol, OpenNetworkCapabilities>;

/** A family with its dependencies supplied, which is all a resolver needs. */
export type BoundNetworkFamily = {
    readonly family: string;
    isSupportedNetwork(symbol: string): boolean;
    /** `undefined` when the symbol belongs to another family. */
    resolveNetwork(context: NetworkContext): OpenNetwork | undefined;
};

export type FamilyDefinition<
    TFamily extends string,
    TSymbol extends string,
    TDeps,
    TCapabilities,
> = {
    readonly family: TFamily;
    readonly symbols: readonly TSymbol[];
    getConfig(symbol: TSymbol): SuiteCommonNetworkConfig;
    readonly capabilities: CapabilityProviders<TDeps, TSymbol, TCapabilities>;
};

export type NetworkFamily<TFamily extends string, TSymbol extends string, TDeps, TCapabilities> = {
    readonly family: TFamily;
    readonly symbols: readonly TSymbol[];
    isSupportedNetwork(symbol: string): symbol is TSymbol;
    /** Closed: the result keeps the literal symbol and the family's own capability types. */
    createNetwork<TNetworkSymbol extends TSymbol>(
        deps: TDeps,
        context: NetworkContext<TNetworkSymbol>,
    ): Network<TFamily, TNetworkSymbol, TCapabilities>;
    bind(deps: TDeps): BoundNetworkFamily;
};

/** Keeps the provider's types when it is declared apart from the family it belongs to. */
export const defineCapability = <TDeps, TSymbol extends string, TCapability>(
    provider: CapabilityProvider<TDeps, TSymbol, TCapability>,
): CapabilityProvider<TDeps, TSymbol, TCapability> => provider;

const createFamily = <
    TFamily extends string,
    TSymbol extends string,
    TDeps,
    TCapabilities extends OpenNetworkCapabilities,
>(
    definition: FamilyDefinition<TFamily, TSymbol, TDeps, TCapabilities>,
): NetworkFamily<TFamily, TSymbol, TDeps, NetworkCapabilities<TCapabilities>> => {
    const isSupportedNetwork = (symbol: string): symbol is TSymbol =>
        isArrayMember(symbol, definition.symbols);

    const createCapabilities = (
        deps: TDeps,
        network: NetworkDescription<TSymbol>,
    ): NetworkCapabilities<TCapabilities> => {
        const providers: [string, CapabilityProvider<TDeps, TSymbol, unknown>][] = Object.entries(
            definition.capabilities,
        );
        const capabilities = providers.flatMap(([name, provider]) =>
            areRequirementsMet({
                requirements: provider.requires,
                config: network.config,
                context: network.context,
            })
                ? [[name, provider.create(deps, network)] as const]
                : [],
        );

        // Each entry comes from the provider under the same name, which `CapabilityProviders`
        // typed; rebuilding the object from entries loses only that pairing.
        return Object.fromEntries(capabilities) as NetworkCapabilities<TCapabilities>;
    };

    const createNetwork = <TNetworkSymbol extends TSymbol>(
        deps: TDeps,
        context: NetworkContext<TNetworkSymbol>,
    ): Network<TFamily, TNetworkSymbol, NetworkCapabilities<TCapabilities>> => {
        const description: NetworkDescription<TNetworkSymbol> = {
            symbol: context.symbol,
            context,
            config: definition.getConfig(context.symbol),
        };

        return {
            ...description,
            family: definition.family,
            capabilities: createCapabilities(deps, description),
        };
    };

    return {
        family: definition.family,
        symbols: definition.symbols,
        isSupportedNetwork,
        createNetwork,
        bind: deps => ({
            family: definition.family,
            isSupportedNetwork,
            resolveNetwork: context => {
                const { symbol } = context;

                if (!isSupportedNetwork(symbol)) {
                    return undefined;
                }

                // The narrowed symbol keeps its open brand, so the network stays addressable by
                // the symbol the app resolved it with.
                return createNetwork(deps, { ...context, symbol });
            },
        }),
    };
};

/**
 * Builds a family factory: given dependencies and a context, it creates the network for one of
 * the family's symbols, with exactly the capabilities whose requirements that context meets.
 *
 * The dependencies are stated first, `defineFamily<Deps>()({ ... })`, because nothing in the
 * definition lets them be inferred, and every provider must be satisfied by the same ones.
 */
export const defineFamily =
    <TDeps>() =>
    <
        TFamily extends string,
        TSymbol extends string,
        // A capability under a name the app knows must match that contract.
        TCapabilities extends OpenNetworkCapabilities,
    >(
        definition: FamilyDefinition<TFamily, TSymbol, TDeps, TCapabilities>,
    ): NetworkFamily<TFamily, TSymbol, TDeps, NetworkCapabilities<TCapabilities>> =>
        createFamily(definition);
