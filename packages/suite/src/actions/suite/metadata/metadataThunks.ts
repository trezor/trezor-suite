import { createThunk } from '@suite-common/redux-utils';
import {
    selectIsSuiteSyncEnabled,
    selectSuiteSyncAccountAddressesByAccount,
    selectSuiteSyncAccountLabel,
    selectSuiteSyncOutputLabelsByAccount,
    selectSuiteSyncOwnerForDeviceStaticId,
    suiteSyncToBip329,
} from '@suite-common/suite-sync';
import { triggerWebDownloadFile } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectAccounts, selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { sanitizeFilename } from '@trezor/utils';

import { GetDefaultAccountLabelParams } from 'src/hooks/suite/useDefaultAccountLabel';
import {
    selectLabelingDataForAccount,
    selectSelectedProviderForLabels,
} from 'src/reducers/suite/metadataReducer';
import { Dispatch, GetState } from 'src/types/suite';
import { AccountLabels, MetadataProvider, WalletLabels } from 'src/types/suite/metadata';
import type {
    AbstractMetadataProvider,
    Bip329Label,
    PasswordManagerState,
} from 'src/types/suite/metadata';
import * as metadataUtils from 'src/utils/suite/metadata';
import { slip15ToBip329 } from 'src/utils/suite/slip15ToBip329';

import { setAccountAdd } from './metadataActions';
import * as METADATA from './metadataConstants';
import * as METADATA_LABELING from './metadataLabelingConstants';

/**
 * dispose metadata from all labelable objects.
 */
export const disposeMetadata = () => (dispatch: Dispatch, getState: GetState) => {
    const provider = selectSelectedProviderForLabels(getState());

    if (!provider) {
        return;
    }

    dispatch({
        type: METADATA.SET_DATA,
        payload: {
            provider,
            data: undefined,
        },
    });
};

export const disposeMetadataKeys = () => (dispatch: Dispatch, getState: GetState) => {
    const devices = selectDevices(getState());
    const accounts = selectAccounts(getState());

    accounts.forEach(account => {
        const updatedAccount = JSON.parse(JSON.stringify(account));

        delete updatedAccount.metadata[METADATA_LABELING.ENCRYPTION_VERSION];
        dispatch(setAccountAdd(updatedAccount));
    });

    devices.forEach(device => {
        if (device.state?.staticSessionId) {
            // set metadata as disabled for this device, remove all metadata related information
            dispatch({
                type: METADATA.SET_DEVICE_METADATA,
                payload: {
                    deviceState: device.state.staticSessionId,
                    metadata: {},
                },
            });
        }
    });
};

export const disableMetadata = () => (dispatch: Dispatch) => {
    dispatch({
        type: METADATA.DISABLE,
    });
    // dispose metadata values and keys
    dispatch(disposeMetadata());
    dispatch(disposeMetadataKeys());
};

type SetMetadataParams = {
    provider: MetadataProvider;
    fileName: string;
    data: WalletLabels | AccountLabels | PasswordManagerState;
};

export const setMetadata =
    ({ provider, fileName, data }: SetMetadataParams) =>
    (dispatch: Dispatch) => {
        dispatch({
            type: METADATA.SET_DATA,
            payload: {
                provider,
                data: {
                    [fileName]: data,
                },
            },
        });
    };

type EncryptAndSaveMetadataParams = {
    data: AccountLabels | WalletLabels | PasswordManagerState;
    aesKey: string;
    fileName: string;
    providerInstance: AbstractMetadataProvider;
};

export const encryptAndSaveMetadata = async ({
    data,
    aesKey,
    fileName,
    providerInstance,
}: EncryptAndSaveMetadataParams) => {
    const encrypted = await metadataUtils.encrypt(
        {
            version: METADATA_LABELING.FORMAT_VERSION,
            ...data,
        },
        aesKey,
    );

    return providerInstance.setFileContent(fileName, encrypted);
};

export const exportMetadataToBip329File = createThunk<
    void,
    {
        getDefaultAccountLabel: (params: GetDefaultAccountLabelParams) => string;
        account: Account;
    },
    void
>(
    METADATA.EXPORT_METADATA_TO_BIP329_FILE,
    ({ account, getDefaultAccountLabel }, { dispatch, getState }) => {
        const showExportErrorToast = () => {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Exporting labels BIP 329 failed',
                }),
            );
        };

        try {
            const state = getState();
            const device = selectSelectedDevice(state);
            const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(state);

            const staticSessionId = device?.state?.staticSessionId;
            if (!staticSessionId) {
                showExportErrorToast();

                return;
            }

            let finalAccountLabel = getDefaultAccountLabel({
                accountType: account.accountType,
                symbol: account.symbol,
                index: account.index,
            });
            let labelsToExport: Bip329Label[] = [];

            if (isSuiteSyncEnabled) {
                const owner = selectSuiteSyncOwnerForDeviceStaticId(state, staticSessionId);
                if (owner === null) {
                    showExportErrorToast();

                    return;
                }

                const { walletDescriptor } = parseDeviceStaticSessionId(account.deviceState);

                const suiteSyncAccountLabel = selectSuiteSyncAccountLabel(
                    state,
                    walletDescriptor,
                    account.descriptor,
                    account.symbol,
                );
                if (suiteSyncAccountLabel) {
                    finalAccountLabel = suiteSyncAccountLabel;
                }

                const suiteSyncAddressLabels = selectSuiteSyncAccountAddressesByAccount(
                    state,
                    walletDescriptor,
                    account.descriptor,
                    account.symbol,
                );

                const suiteSyncOutputLabels = selectSuiteSyncOutputLabelsByAccount(
                    state,
                    walletDescriptor,
                    account.descriptor,
                    account.symbol,
                );

                labelsToExport = suiteSyncToBip329({
                    outputLabels: suiteSyncOutputLabels,
                    addressLabels: suiteSyncAddressLabels,
                    allSpendable: true,
                });
            } else {
                // Legacy non-SuiteSync export.
                const accountMetadata = selectLabelingDataForAccount(state, account.key);
                if (accountMetadata.accountLabel) {
                    finalAccountLabel = accountMetadata.accountLabel;
                }
                labelsToExport = slip15ToBip329(accountMetadata);
            }

            // Maps each object to its JSON string representation
            const jsonlString = labelsToExport.map(obj => JSON.stringify(obj)).join('\n');

            const blob = new Blob([jsonlString], { type: 'application/jsonl' });

            const safeLabel = sanitizeFilename(finalAccountLabel);
            const filename = `${safeLabel || 'account_labels'}_export_bip329.jsonl`;

            triggerWebDownloadFile(blob, filename);
        } catch {
            showExportErrorToast();
        }
    },
);
