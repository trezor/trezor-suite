import produce from 'immer';

import {
    AccountsRootState,
    selectAccountByKey,
    DeviceRootState,
    selectSelectedDevice,
    State,
    selectDeviceByState,
    deviceActions,
    selectDeviceByStaticSessionId,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { DeviceState, StaticSessionId } from '@trezor/connect';

import {
    STORAGE,
    METADATA,
    METADATA_LABELING,
    METADATA_PASSWORDS,
} from 'src/actions/suite/constants';
import { Action, TrezorDevice } from 'src/types/suite';
import {
    MetadataState,
    WalletLabels,
    AccountLabels,
    PasswordManagerState,
} from 'src/types/suite/metadata';
import { Account } from 'src/types/wallet';
import {
    DEFAULT_ACCOUNT_METADATA,
    DEFAULT_WALLET_METADATA,
} from 'src/actions/suite/constants/metadataLabelingConstants';

import { SuiteRootState } from './suiteReducer';

export const initialState: MetadataState = {
    // is Suite trying to load metadata (get master key -> sync cloud)?
    enabled: false,
    initiating: false,
    providers: {},
    selectedProvider: {
        labels: '',
        passwords: '',
    },
    error: {},
    key_filename: {},
    deviceSecrets: {},
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
                if (!draft.providers[action.payload.clientId]) {
                    draft.providers[action.payload.clientId] = {
                        ...action.payload,
                        data: {},
                    };
                }
                break;
            case METADATA.REMOVE_PROVIDER:
                delete draft.providers[action.payload.clientId];
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
                const targetProvider = draft.providers[action.payload.provider.clientId];
                if (!targetProvider) {
                    break;
                }
                targetProvider.data = { ...targetProvider.data, ...action.payload.data };

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
                if (action.payload.device.state?.staticSessionId) {
                    delete draft.error?.[action.payload.device.state.staticSessionId];
                }
                break;
            case METADATA.SET_KEY_FILENAME:
                draft.key_filename[action.payload.key] = action.payload.fileName;
                break;
            case METADATA.SET_DEVICE_SECRET:
                draft.deviceSecrets[action.payload.staticSessionId] = action.payload.value;
                break;

            // no default
        }
    });

export const selectMetadata = (state: MetadataRootState) => state.metadata;

/**
 * Select currently selected provider for metadata of type 'labels'
 */
export const selectSelectedProviderForLabels = (state: { metadata: MetadataState }) =>
    state.metadata.providers[state.metadata.selectedProvider.labels];

export const selectSelectedProviderForPasswords = (state: { metadata: MetadataState }) =>
    state.metadata.providers[state.metadata.selectedProvider.passwords];

/**
 * Select metadata of type 'labels' for currently selected account
 */
export const selectLabelingDataForSelectedAccount = (state: {
    metadata: MetadataState;
    wallet: { selectedAccount: { account?: Account } };
}) => {
    const provider = selectSelectedProviderForLabels(state);
    const { account } = state.wallet?.selectedAccount || {};

    if (!account?.metadata.key) {
        return DEFAULT_ACCOUNT_METADATA;
    }

    const filename = state.metadata.key_filename[account?.metadata.key];

    return (provider?.data[filename] as AccountLabels) || DEFAULT_ACCOUNT_METADATA;
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
    if (!account?.metadata.key) {
        return DEFAULT_ACCOUNT_METADATA;
    }

    const filename = state.metadata.key_filename[account?.metadata.key];

    return (provider?.data[filename] as AccountLabels) || DEFAULT_ACCOUNT_METADATA;
};

/**
 * Returns dict <account-key: account-label>
 */
export const selectAccountLabels = (state: {
    metadata: MetadataState;
    wallet: { accounts: Account[] };
}) => {
    return state.wallet.accounts.reduce(
        (dict, account) => {
            const data = selectLabelingDataForAccount(state, account.key);
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
    deviceState?: DeviceState | StaticSessionId,
) => {
    if (!deviceState) {
        return DEFAULT_WALLET_METADATA;
    }
    const provider = selectSelectedProviderForLabels(state);
    const device =
        typeof deviceState === 'string'
            ? selectDeviceByStaticSessionId(state, deviceState)
            : selectDeviceByState(state, deviceState);
    const key = device?.state?.staticSessionId;

    if (!key) {
        return DEFAULT_WALLET_METADATA;
    }

    const filename = state.metadata.key_filename[key];

    if (!filename) {
        return DEFAULT_WALLET_METADATA;
    }

    return (provider?.data[filename] as WalletLabels) || DEFAULT_ACCOUNT_METADATA;
};

export const selectLabelableEntities = (state: MetadataRootState, deviceState: StaticSessionId) => {
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
            .filter((device: TrezorDevice) => device.state?.staticSessionId === deviceState)
            .map((device: TrezorDevice) => ({
                ...device.metadata,
                // todo:
                state: device.state,
                staticSessionId: device.state?.staticSessionId,
                type: 'device' as const,
            })),
    ];
};

const selectLabelableEntityByKey = (
    state: MetadataRootState,
    deviceState: StaticSessionId,
    entityKey: string,
) =>
    selectLabelableEntities(state, deviceState).find(e => {
        if ('key' in e) {
            return e.key === entityKey;
        }
        if ('state' in e) {
            return e.state?.staticSessionId === entityKey;
        }

        return false;
    });

/**
 * Is everything ready to add label?
 */
export const selectIsLabelingAvailable = (state: MetadataRootState) => {
    const { enabled, error } = selectMetadata(state);
    const provider = selectSelectedProviderForLabels(state);
    const device = selectSelectedDevice(state);

    return (
        enabled &&
        device?.metadata?.[METADATA_LABELING.ENCRYPTION_VERSION] &&
        !!provider &&
        device.state?.staticSessionId &&
        !error?.[device.state.staticSessionId]
    );
};

/**
 it is possible to initiate metadata
 */
export const selectIsLabelingInitPossible = (state: MetadataRootState) => {
    const device = selectSelectedDevice(state);

    return (
        // device already has keys or it is at least connected and authorized
        (device?.metadata?.[METADATA_LABELING.ENCRYPTION_VERSION] ||
            (device?.connected && device.state)) &&
        // storage provider is connected or we are at least able to connect to it
        (selectSelectedProviderForLabels(state) || state.suite.online)
    );
};

export const selectIsLabelingAvailableForEntity = (
    state: MetadataRootState,
    entityKey: string,
    deviceState?: StaticSessionId,
) => {
    const device = deviceState
        ? selectDeviceByStaticSessionId(state, deviceState)
        : selectSelectedDevice(state);
    if (!device?.state?.staticSessionId) return false;
    const entity = selectLabelableEntityByKey(state, device.state.staticSessionId, entityKey);

    return (
        selectIsLabelingAvailable(state) &&
        entity &&
        entity?.[METADATA_LABELING.ENCRYPTION_VERSION]?.fileName
    );
};

export const selectPasswordManagerState = (
    state: {
        metadata: MetadataState;
    },
    fileName?: string,
) => {
    const provider = selectSelectedProviderForPasswords(state);

    if (!fileName || !provider || !provider?.data?.[fileName]) {
        return METADATA_PASSWORDS.DEFAULT_PASSWORD_MANAGER_STATE;
    }

    return (provider.data[fileName] ||
        METADATA_PASSWORDS.DEFAULT_PASSWORD_MANAGER_STATE) as PasswordManagerState;
};

export const selectLabelingValueBeingEdited = ({ metadata }: MetadataRootState) => metadata.editing;

export default metadataReducer;
