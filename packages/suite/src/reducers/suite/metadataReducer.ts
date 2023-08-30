import produce from 'immer';

import { selectAccountByKey } from '@suite-common/wallet-core';

import { STORAGE, METADATA } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';
import { MetadataState, WalletLabels, AccountLabels } from 'src/types/suite/metadata';
import { Account } from 'src/types/wallet';
import {
    DEFAULT_ACCOUNT_METADATA,
    DEFAULT_WALLET_METADATA,
} from 'src/actions/suite/constants/metadataConstants';

import { DeviceRootState, selectDevice, selectDevices, State } from './deviceReducer';
import { SuiteRootState } from './suiteReducer';

export const initialState: MetadataState = {
    // is Suite trying to load metadata (get master key -> sync cloud)?
    enabled: false,
    initiating: false,
    providers: [],
    selectedProvider: {
        labels: '',
    },
    entities: [],
    failedMigration: {},
};

type MetadataRootState = {
    metadata: MetadataState;
} & DeviceRootState &
    SuiteRootState;

const metadataReducer = (state = initialState, action: Action): MetadataState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                return action.payload.metadata || state;
            case METADATA.ENABLE:
                draft.enabled = true;
                break;
            case METADATA.DISABLE:
                draft.enabled = false;
                break;
            case METADATA.ADD_PROVIDER:
                draft.providers.push(action.payload);
                break;
            case METADATA.REMOVE_PROVIDER:
                draft.providers = draft.providers.filter(
                    p => p.clientId !== action.payload.clientId,
                );
                break;
            case METADATA.SET_SELECTED_PROVIDER:
                draft.selectedProvider[action.payload.dataType] = action.payload.clientId;
                break;
            case METADATA.SET_EDITING:
                draft.editing = action.payload;
                break;
            case METADATA.SET_INITIATING:
                draft.initiating = action.payload;
                break;
            case METADATA.SET_DATA: {
                const targetProvider = draft.providers.find(
                    p =>
                        p.type === action.payload.provider.type &&
                        p.clientId === action.payload.provider.clientId,
                );
                if (!targetProvider) {
                    break;
                }
                if (!action.payload.data) {
                    targetProvider.data = {};
                } else {
                    targetProvider.data = { ...targetProvider.data, ...action.payload.data };
                }

                break;
            }
            case METADATA.SET_ENTITIES_DESCRIPTORS:
                draft.entities = action.payload;
                break;
            case METADATA.SET_FAILED_MIGRATION:
                if (action.payload.failed) {
                    draft.failedMigration[action.payload.deviceState] = action.payload.failed;
                } else {
                    delete draft.failedMigration[action.payload.deviceState];
                }
                break;

            // no default
        }
    });

export const selectMetadata = (state: MetadataRootState) => state.metadata;

/**
 * Select currently selected provider for metadata of type 'labels'
 */
export const selectSelectedProviderForLabels = (state: { metadata: MetadataState }) =>
    state.metadata.providers.find(p => p.clientId === state.metadata.selectedProvider.labels);

/**
 * Select metadata of type 'labels' for currently selected account
 */
export const selectLabelingDataForSelectedAccount = (state: {
    metadata: MetadataState;
    wallet: { selectedAccount: { account?: Account } };
}) => {
    const provider = selectSelectedProviderForLabels(state);
    const { selectedAccount } = state.wallet;

    const metadataKeys = selectedAccount?.account?.metadata[METADATA.ENCRYPTION_VERSION];
    if (!metadataKeys || !metadataKeys.fileName || !provider?.data[metadataKeys.fileName]) {
        return DEFAULT_ACCOUNT_METADATA;
    }

    return provider.data[metadataKeys.fileName] as AccountLabels;
};

/**
 * Select metadata of type 'labels' for requested account
 */
export const selectLabelingDataForAccount = (
    state: { metadata: MetadataState; wallet: { accounts: Account[] } },
    accountKey: string,
) => {
    const provider = selectSelectedProviderForLabels(state);
    const account = selectAccountByKey(state, accountKey);
    const metadataKeys = account?.metadata?.[METADATA.ENCRYPTION_VERSION];

    if (!metadataKeys || !metadataKeys?.fileName || !provider?.data[metadataKeys.fileName]) {
        return DEFAULT_ACCOUNT_METADATA;
    }

    return provider.data[metadataKeys.fileName] as AccountLabels;
};

export const selectAccountLabelForAccount = (
    state: { metadata: MetadataState; wallet: { accounts: Account[] } },
    accountKey: string,
) => {
    const labelingData = selectLabelingDataForAccount(state, accountKey);
    return labelingData.accountLabel;
};

/**
 * Returns dict <account-key: account-label>
 */
export const selectAccountLabels = (state: {
    metadata: MetadataState;
    wallet: { accounts: Account[] };
}) => {
    const provider = selectSelectedProviderForLabels(state);

    return state.wallet.accounts.reduce((dict, account) => {
        const metadataKeys = account?.metadata?.[METADATA.ENCRYPTION_VERSION];
        if (!metadataKeys || !metadataKeys?.fileName || !provider?.data[metadataKeys.fileName]) {
            return dict;
        }
        const data = provider.data[metadataKeys.fileName];
        if ('accountLabel' in data) {
            dict[account.key] = data.accountLabel;
        }
        return dict;
    }, {} as Record<string, string | undefined>);
};

/**
 * Select metadata of type 'labels' for requested device
 */
export const selectLabelingDataForWallet = (
    state: { metadata: MetadataState; device: State },
    deviceState?: string,
) => {
    const provider = selectSelectedProviderForLabels(state);
    const devices = selectDevices(state);
    const device = devices.find(d => d.state === deviceState);
    if (!device?.metadata[METADATA.ENCRYPTION_VERSION]) {
        return DEFAULT_WALLET_METADATA;
    }
    const metadataKeys = device?.metadata[METADATA.ENCRYPTION_VERSION];

    if (metadataKeys && metadataKeys.fileName && provider?.data[metadataKeys.fileName]) {
        return provider.data[metadataKeys.fileName] as WalletLabels;
    }
    return DEFAULT_WALLET_METADATA;
};

/**
 * Is everything ready to add label?
 */
export const selectIsLabelingAvailable = (state: MetadataRootState) => {
    const { enabled, failedMigration } = selectMetadata(state);
    const provider = selectSelectedProviderForLabels(state);
    const device = selectDevice(state);

    return (
        enabled &&
        device?.metadata?.[METADATA.ENCRYPTION_VERSION] &&
        !!provider &&
        device.state &&
        !failedMigration[device.state]
    );
};

/**
 it is possible to initiate metadata 
 */
export const selectIsLabelingInitPossible = (state: MetadataRootState) => {
    const device = selectDevice(state);

    return (
        // device already has keys or it is at least connected and authorized
        (device?.metadata?.[METADATA.ENCRYPTION_VERSION] || (device?.connected && device.state)) &&
        // storage provider is connected or we are at least able to connect to it
        (selectSelectedProviderForLabels(state) || state.suite.online)
    );
};

export default metadataReducer;
