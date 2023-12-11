import produce from 'immer';

import {
    AccountsRootState,
    selectAccountByKey,
    DeviceRootState,
    selectDevice,
    selectDevices,
    State,
    selectDeviceByState,
    deviceActions,
} from '@suite-common/wallet-core';

import { STORAGE, METADATA } from 'src/actions/suite/constants';
import { Action, TrezorDevice } from 'src/types/suite';
import { MetadataState, WalletLabels, AccountLabels } from 'src/types/suite/metadata';
import { Account } from 'src/types/wallet';
import {
    DEFAULT_ACCOUNT_METADATA,
    DEFAULT_WALLET_METADATA,
} from 'src/actions/suite/constants/metadataConstants';

import { SuiteRootState } from './suiteReducer';
import { AccountKey } from '@suite-common/wallet-types';

export const initialState: MetadataState = {
    // is Suite trying to load metadata (get master key -> sync cloud)?
    enabled: false,
    initiating: false,
    providers: [],
    selectedProvider: {
        labels: '',
        passwords: '',
    },
    error: {},
};

type MetadataRootState = {
    metadata: MetadataState;
} & DeviceRootState &
    SuiteRootState &
    AccountsRootState;

const metadataReducer = (state = initialState, action: Action): MetadataState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                return {
                    ...state,
                    ...action.payload.metadata,
                };
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
                // todo: identification should be dataType + clientId
                // at the moment, it is not needed because each feature (passwords, labels) has distinct provider. In case we wanted to support 2 different features in 1 provider. we would need to add this?
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
            case METADATA.SET_ERROR_FOR_DEVICE:
                if (action.payload.failed) {
                    if (!draft.error) draft.error = {};
                    draft.error[action.payload.deviceState] = action.payload.failed;
                } else {
                    delete draft.error?.[action.payload.deviceState];
                }
                break;
            case deviceActions.forgetDevice.type:
                if (action.payload.state) {
                    delete draft.error?.[action.payload.state];
                }

            // no default
        }
    });

export const selectMetadata = (state: MetadataRootState) => state.metadata;

/**
 * Select currently selected provider for metadata of type 'labels'
 */
export const selectSelectedProviderForLabels = (state: { metadata: MetadataState }) =>
    state.metadata.providers.find(p => p.clientId === state.metadata.selectedProvider.labels);

export const selectSelectedProviderForPasswords = (state: { metadata: MetadataState }) =>
    state.metadata.providers.find(p => p.clientId === state.metadata.selectedProvider.passwords);

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
    accountKey: AccountKey,
) => {
    const provider = selectSelectedProviderForLabels(state);
    const account = selectAccountByKey(state, accountKey);
    const metadataKeys = account?.metadata?.[METADATA.ENCRYPTION_VERSION];

    if (!metadataKeys || !metadataKeys?.fileName || !provider?.data[metadataKeys.fileName]) {
        return DEFAULT_ACCOUNT_METADATA;
    }

    return provider.data[metadataKeys.fileName] as AccountLabels;
};

/**
 * Returns dict <account-key: account-label>
 */
export const selectAccountLabels = (state: {
    metadata: MetadataState;
    wallet: { accounts: Account[] };
}) => {
    const provider = selectSelectedProviderForLabels(state);

    return state.wallet.accounts.reduce(
        (dict, account) => {
            const metadataKeys = account?.metadata?.[METADATA.ENCRYPTION_VERSION];
            if (
                !metadataKeys ||
                !metadataKeys?.fileName ||
                !provider?.data[metadataKeys.fileName]
            ) {
                return dict;
            }
            const data = provider.data[metadataKeys.fileName];
            if ('accountLabel' in data) {
                dict[account.key] = data.accountLabel;
            }
            return dict;
        },
        {} as Record<string, string | undefined>,
    );
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

export const selectLabelableEntities = (state: MetadataRootState, deviceState: string) => {
    const { wallet, device } = state;
    const { devices } = device;
    const { accounts } = wallet;
    return [
        ...accounts
            .filter(a => a.deviceState === deviceState)
            .map(account => ({
                ...account.metadata,
                key: account.key,
                type: 'account' as const,
            })),
        ...devices
            .filter((device: TrezorDevice) => device.state === deviceState)
            .map((device: TrezorDevice) => ({
                ...device.metadata,
                state: device.state,
                type: 'device' as const,
            })),
    ];
};

const selectLabelableEntityByKey = (
    state: MetadataRootState,
    deviceState: string,
    entityKey: string,
) =>
    selectLabelableEntities(state, deviceState).find(e => {
        if ('key' in e) {
            return e.key === entityKey;
        }
        if ('state' in e) {
            return e.state === entityKey;
        }
        return false;
    });

/**
 * Is everything ready to add label?
 */
export const selectIsLabelingAvailable = (state: MetadataRootState) => {
    const { enabled, error } = selectMetadata(state);
    const provider = selectSelectedProviderForLabels(state);
    const device = selectDevice(state);

    return (
        enabled &&
        device?.metadata?.[METADATA.ENCRYPTION_VERSION] &&
        !!provider &&
        device.state &&
        !error?.[device.state]
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

export const selectIsLabelingAvailableForEntity = (
    state: MetadataRootState,
    entityKey: string,
    deviceState?: string,
) => {
    const device = deviceState ? selectDeviceByState(state, deviceState) : selectDevice(state);
    if (!device?.state) return false;
    const entity = selectLabelableEntityByKey(state, device.state, entityKey);
    return (
        selectIsLabelingAvailable(state) &&
        entity &&
        entity?.[METADATA.ENCRYPTION_VERSION]?.fileName
    );
};

export default metadataReducer;
