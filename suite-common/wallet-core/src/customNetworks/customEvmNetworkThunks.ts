import type {
    RegisterCustomEvmNetworkDep,
    UnregisterCustomEvmNetworkDep,
} from '@suite-common/networks';
import {
    getNetworkByEvmChainId,
    isNetworkSymbol,
    registerLegacyCustomEvmNetwork,
    unregisterLegacyNetwork,
} from '@suite-common/wallet-config';
import {
    type CustomEvmNetworkDefinition,
    getCustomEvmNetworkSymbol,
} from '@suite-common/wallet-types';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect from '@trezor/connect';
import { buildCustomEvmNetworkConfig } from '@trezor/network-ethereum-suite-common';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import {
    CUSTOM_EVM_NETWORKS_MODULE_PREFIX,
    customEvmNetworksActions,
} from './customEvmNetworksActions';
import { accountsActions } from '../accounts/accountsActions';
import { selectAccounts } from '../accounts/accountsSelectors';
import { selectNetworkBlockchainInfo } from '../blockchain/blockchainReducer';
import type { WalletCoreCompoundRootState } from '../selectors';
import { selectCustomEvmNetworks } from '../settings/walletSettingsReducer';
import { changeCoinVisibilityThunk } from '../settings/walletSettingsThunks';

// Translation ids, shared with the custom backend form.
export const CUSTOM_EVM_NETWORK_ERROR = {
    alreadyExists: 'TR_CUSTOM_NETWORK_ALREADY_EXISTS',
    connection: 'TR_CUSTOM_BACKEND_CONNECTION_ERROR',
    chainMismatch: 'TR_CUSTOM_BACKEND_CHAIN_MISMATCH',
    validation: 'TR_CUSTOM_BACKEND_VALIDATION_ERROR',
} as const;

export type CustomEvmNetworkError =
    (typeof CUSTOM_EVM_NETWORK_ERROR)[keyof typeof CUSTOM_EVM_NETWORK_ERROR];

export type CustomEvmNetworkRejection = {
    error: CustomEvmNetworkError;
    /** Chain id reported by the RPC, set on a chain id mismatch. */
    actualChainId?: number;
};

type RpcProbeResult =
    { rejection: CustomEvmNetworkRejection } | { rejection?: undefined; blockTimeSeconds?: number };

// Checks that the RPC serves the expected chain and measures the chain's block time, which a
// user-supplied network carries no data about.
const probeRpc = async ({
    chainId,
    rpcUrls,
}: CustomEvmNetworkDefinition): Promise<RpcProbeResult> => {
    const [url] = rpcUrls;

    if (!url) {
        return { rejection: { error: CUSTOM_EVM_NETWORK_ERROR.validation } };
    }

    try {
        const result = await TrezorBlockchain.evmRpcGetChainId({ url, measureBlockTime: true });

        if (!result.success) {
            return { rejection: { error: CUSTOM_EVM_NETWORK_ERROR.connection } };
        }

        if (result.payload.chainId !== chainId) {
            return {
                rejection: {
                    error: CUSTOM_EVM_NETWORK_ERROR.chainMismatch,
                    actualChainId: result.payload.chainId,
                },
            };
        }

        return { blockTimeSeconds: result.payload.blockTimeSeconds };
    } catch {
        return { rejection: { error: CUSTOM_EVM_NETWORK_ERROR.validation } };
    }
};

/** Lets the backends serve the network; they forget it on every start. */
export const registerCustomEvmNetworkBackend = ({
    symbol,
    name,
    rpcUrls,
    blockTimeSeconds,
}: CustomEvmNetworkDefinition) =>
    TrezorBlockchain.registerEvmNetwork({ symbol, name, rpcUrls, blockTimeSeconds });

export type AddCustomEvmNetworkThunkState = WalletCoreCompoundRootState;

export type AddCustomEvmNetworkThunkDeps = WithServices<{
    networks: RegisterCustomEvmNetworkDep;
}>;

type AddCustomEvmNetworkThunkParams = { definition: CustomEvmNetworkDefinition };

export const addCustomEvmNetworkThunk = createThunk<
    CustomEvmNetworkDefinition,
    AddCustomEvmNetworkThunkParams,
    {
        state: AddCustomEvmNetworkThunkState;
        extra: AddCustomEvmNetworkThunkDeps;
        rejectValue: CustomEvmNetworkRejection;
    }
>(
    `${CUSTOM_EVM_NETWORKS_MODULE_PREFIX}/addCustomEvmNetworkThunk`,
    async ({ definition: requestedDefinition }, { dispatch, extra, rejectWithValue }) => {
        if (
            isNetworkSymbol(requestedDefinition.symbol) ||
            getNetworkByEvmChainId(requestedDefinition.chainId)
        ) {
            return rejectWithValue({ error: CUSTOM_EVM_NETWORK_ERROR.alreadyExists });
        }

        // Storage restores only symbols derived from a chain id, any other would vanish on restart.
        if (requestedDefinition.symbol !== getCustomEvmNetworkSymbol(requestedDefinition.chainId)) {
            return rejectWithValue({ error: CUSTOM_EVM_NETWORK_ERROR.validation });
        }

        const probe = await probeRpc(requestedDefinition);

        if (probe.rejection) {
            return rejectWithValue(probe.rejection);
        }

        const definition: CustomEvmNetworkDefinition = {
            ...requestedDefinition,
            blockTimeSeconds: probe.blockTimeSeconds,
        };

        // Connect goes first: it is the one rejecting the chain ids of its predefined networks, and
        // failing there leaves nothing behind to roll back. A network Connect keeps after a failure
        // further on is harmless, nothing in Suite refers to it.
        const registration = await TrezorConnect.registerEvmNetwork({
            symbol: definition.symbol,
            name: definition.name,
            chainId: definition.chainId,
        });

        if (!registration.success) {
            return rejectWithValue({ error: CUSTOM_EVM_NETWORK_ERROR.validation });
        }

        const backendRegistration = await registerCustomEvmNetworkBackend(definition);

        if (!backendRegistration.success) {
            return rejectWithValue({ error: CUSTOM_EVM_NETWORK_ERROR.validation });
        }

        // The config builder throws on a malformed definition. A half-registered network would make
        // every retry fail as already existing, so the registry entry is rolled back.
        try {
            registerLegacyCustomEvmNetwork(definition);
            extra.services.networks.registerCustomEvmNetwork({
                symbol: definition.symbol,
                config: buildCustomEvmNetworkConfig(definition),
            });
        } catch {
            unregisterLegacyNetwork(definition.symbol);

            return rejectWithValue({ error: CUSTOM_EVM_NETWORK_ERROR.validation });
        }

        dispatch(customEvmNetworksActions.registered({ definition }));

        await dispatch(
            changeCoinVisibilityThunk({ symbol: definition.symbol, shouldBeVisible: true }),
        );

        return definition;
    },
);

export type RemoveCustomEvmNetworkThunkState = WalletCoreCompoundRootState;

export type RemoveCustomEvmNetworkThunkDeps = WithServices<{
    networks: UnregisterCustomEvmNetworkDep;
}>;

type RemoveCustomEvmNetworkThunkParams = { symbol: CustomEvmNetworkDefinition['symbol'] };

// Connect and the backends keep the coin until their next start, which is harmless as nothing in
// Suite refers to it.
export const removeCustomEvmNetworkThunk = createThunk<
    void,
    RemoveCustomEvmNetworkThunkParams,
    { state: RemoveCustomEvmNetworkThunkState; extra: RemoveCustomEvmNetworkThunkDeps }
>(
    `${CUSTOM_EVM_NETWORKS_MODULE_PREFIX}/removeCustomEvmNetworkThunk`,
    async ({ symbol }, { dispatch, getState, extra }) => {
        const isCustomNetwork = selectCustomEvmNetworks(getState()).some(
            definition => definition.symbol === symbol,
        );

        if (!isCustomNetwork) {
            return;
        }

        await dispatch(changeCoinVisibilityThunk({ symbol, shouldBeVisible: false }));

        // Disabling forgets the regular accounts only, imported ones would be left orphaned.
        const accounts = selectAccounts(getState()).filter(account => account.symbol === symbol);
        if (accounts.length > 0) {
            dispatch(accountsActions.removeAccount(accounts));
        }

        // A pending sync would otherwise fire for a network whose blockchain state is gone.
        const { syncTimeout } = selectNetworkBlockchainInfo(getState(), symbol) ?? {};
        if (syncTimeout) {
            clearTimeout(syncTimeout);
        }

        dispatch(customEvmNetworksActions.unregistered({ symbol }));
        unregisterLegacyNetwork(symbol);
        extra.services.networks.unregisterCustomEvmNetwork(symbol);
    },
);
