import { useCallback } from 'react';

import { injectChainNetworksStore } from '@suite-common/chain-data';
import { useServices } from '@suite-common/dependency-injection';
import type { Account } from '@suite-common/wallet-types';
import type { RuntimeEvmNetworkDefinition } from '@trezor/network-ethereum-suite-common';

import {
    type RuntimeChainSendComposed,
    toRuntimeChainSendAccount,
} from 'src/support/runtimeEvmNetworks/runtimeChainSend';

import {
    type SignAndPushTransactionResult,
    useSignAndPushThroughNetwork,
} from './useSignAndPushTransaction';

export type SendOnRuntimeNetworkParams = {
    definition: RuntimeEvmNetworkDefinition;

    /** The wallet account whose address the runtime network is read at. */
    walletAccount: Account;

    /** The account's balance on the runtime network, in whole units. */
    balance: string;
    composed: RuntimeChainSendComposed;
};

/**
 * Signs and broadcasts a send the user composed on a runtime network, from a wallet account's
 * address. Nothing of it reaches the wallet's store; it is followed through the network's own
 * data only.
 */
export const useSendOnRuntimeNetwork = () => {
    // Read when the send starts, so nothing here subscribes to the networks.
    const { chainNetworksStore } = useServices(injectChainNetworksStore);
    const signAndPushThroughNetwork = useSignAndPushThroughNetwork();

    return useCallback(
        ({
            definition,
            walletAccount,
            balance,
            composed,
        }: SendOnRuntimeNetworkParams): Promise<SignAndPushTransactionResult> => {
            const network = chainNetworksStore
                .getSnapshot()
                .find(({ symbol }) => symbol === definition.symbol);
            if (!network) return Promise.resolve(undefined);

            return signAndPushThroughNetwork({
                network,
                target: {
                    kind: 'runtime',
                    runtime: {
                        network: definition,
                        account: toRuntimeChainSendAccount(walletAccount, definition, balance),
                        walletAccountKey: walletAccount.key,
                    },
                },
                formState: composed.formState,
                precomposedTransaction: composed.precomposedTransaction,
            });
        },
        [chainNetworksStore, signAndPushThroughNetwork],
    );
};
