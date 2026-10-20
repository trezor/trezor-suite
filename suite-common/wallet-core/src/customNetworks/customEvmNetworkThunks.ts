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
import type { CustomEvmNetworkDefinition } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import {
    CUSTOM_EVM_NETWORKS_MODULE_PREFIX,
    customEvmNetworksActions,
} from './customEvmNetworksActions';
import { accountsActions } from '../accounts/accountsActions';
import { selectAccounts } from '../accounts/accountsSelectors';
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

const getRpcValidationError = async ({
    chainId,
    rpcUrls,
}: CustomEvmNetworkDefinition): Promise<CustomEvmNetworkRejection | undefined> => {
    const [url] = rpcUrls;

    if (!url) {
        return { error: CUSTOM_EVM_NETWORK_ERROR.validation };
    }

    try {
        const result = await TrezorConnect.blockchainEvmRpcGetChainId({ url });

        if (!result.success) {
            return { error: CUSTOM_EVM_NETWORK_ERROR.connection };
        }

        if (result.payload.chainId !== chainId) {
            return {
                error: CUSTOM_EVM_NETWORK_ERROR.chainMismatch,
                actualChainId: result.payload.chainId,
            };
        }
    } catch {
        return { error: CUSTOM_EVM_NETWORK_ERROR.validation };
    }
};

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
    async ({ definition }, { dispatch, extra, rejectWithValue }) => {
        if (isNetworkSymbol(definition.symbol) || getNetworkByEvmChainId(definition.chainId)) {
            return rejectWithValue({ error: CUSTOM_EVM_NETWORK_ERROR.alreadyExists });
        }

        const rpcValidationError = await getRpcValidationError(definition);

        if (rpcValidationError) {
            return rejectWithValue(rpcValidationError);
        }

        // Connect goes first: it is the one rejecting symbols and chain ids of its bundled networks,
        // and failing there leaves nothing behind to roll back in Suite.
        const registration = await TrezorConnect.blockchainRegisterEvmNetwork({
            symbol: definition.symbol,
            name: definition.name,
            chainId: definition.chainId,
            rpcUrls: definition.rpcUrls,
            testnet: definition.testnet,
        });

        if (!registration.success) {
            return rejectWithValue({ error: CUSTOM_EVM_NETWORK_ERROR.validation });
        }

        registerLegacyCustomEvmNetwork(definition);
        extra.services.networks.registerCustomEvmNetwork(definition);
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

// Connect keeps the coin until its next start, which is harmless as nothing in Suite refers to it.
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

        dispatch(customEvmNetworksActions.unregistered({ symbol }));
        unregisterLegacyNetwork(symbol);
        extra.services.networks.unregisterCustomEvmNetwork(symbol);
    },
);
