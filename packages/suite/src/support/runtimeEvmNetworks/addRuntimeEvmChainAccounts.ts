import type { PortfolioAccount } from '@suite-common/chain-data';
import type { RuntimeEvmNetworkDefinition } from '@trezor/network-ethereum-suite-common';
import type { ChainAccountRef } from '@trezor/network-module-suite-common-types';

/** The accounts whose addresses runtime EVM networks reuse: an EVM address is the same on every chain. */
export const RUNTIME_EVM_ADDRESS_SOURCE_SYMBOL = 'eth';

/**
 * Adds to each Ethereum account its chain account on every runtime EVM network, at the same
 * address. Runtime networks need no discovery: the device signs for the same path on any chain.
 */
export const addRuntimeEvmChainAccounts = (
    accounts: readonly PortfolioAccount[],
    runtimeNetworks: readonly RuntimeEvmNetworkDefinition[],
): readonly PortfolioAccount[] => {
    if (runtimeNetworks.length === 0) return accounts;

    return accounts.map(account => {
        const source = account.chainAccounts.find(
            ref => ref.symbol === RUNTIME_EVM_ADDRESS_SOURCE_SYMBOL,
        );
        if (!source) return account;

        const runtimeRefs = runtimeNetworks.map(({ symbol }): ChainAccountRef => ({
            symbol,
            descriptor: source.descriptor,
            accountType: source.accountType,
            connectionIdentity: source.connectionIdentity,
        }));

        return { ...account, chainAccounts: [...account.chainAccounts, ...runtimeRefs] };
    });
};
