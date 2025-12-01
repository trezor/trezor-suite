import { createAction } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import {
    selectAccountLabel,
    selectIsSuiteSyncEnabled,
    suiteSyncToBip329,
} from '@suite-common/suite-sync';
import {
    selectAddressLabelsByAccount,
    selectOutputLabelsByAccount,
} from '@suite-common/suite-sync/src/labeling/labelingSelectors';
import { triggerWebDownloadFile } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';
import { createZip, sanitizeFilename } from '@trezor/utils';

import { METADATA, METADATA_LABELING } from 'src/actions/suite/constants';
import { GetDefaultAccountLabelParams } from 'src/hooks/suite/useDefaultAccountLabel';
import {
    selectLabelingDataForSelectedAccount,
    selectSelectedProviderForLabels,
} from 'src/reducers/suite/metadataReducer';
import { Dispatch, GetState } from 'src/types/suite';
import {
    AccountLabels,
    DataType,
    DeviceMetadata,
    Labels,
    MetadataProvider,
    WalletLabels,
} from 'src/types/suite/metadata';
import type {
    AbstractMetadataProvider,
    Bip329Label,
    PasswordManagerState,
} from 'src/types/suite/metadata';
import * as metadataUtils from 'src/utils/suite/metadata';
import { slip15ToBip329 } from 'src/utils/suite/slip15ToBip329';

import { getProviderInstance } from './metadataProviderActions';

export type MetadataAction =
    | { type: typeof METADATA.ENABLE }
    | { type: typeof METADATA.DISABLE }
    | { type: typeof METADATA.SET_EDITING; payload: string | undefined }
    | { type: typeof METADATA.SET_INITIATING; payload: boolean }
    | {
          type: typeof METADATA.SET_DEVICE_METADATA;
          payload: { deviceState: StaticSessionId; metadata: DeviceMetadata };
      }
    | {
          type: typeof METADATA.SET_DEVICE_METADATA_PASSWORDS;
          payload: { deviceState: StaticSessionId; metadata: DeviceMetadata };
      }
    | {
          type: typeof METADATA.REMOVE_PROVIDER;
          payload: Pick<MetadataProvider, 'clientId'>;
      }
    | {
          type: typeof METADATA.ADD_PROVIDER;
          payload: MetadataProvider;
      }
    | {
          type: typeof METADATA.SET_DATA;
          payload: {
              provider: Omit<MetadataProvider, 'data'> & Pick<Partial<MetadataProvider>, 'data'>;
              data: Record<string, Labels | PasswordManagerState> | undefined;
          };
      }
    | {
          type: typeof METADATA.SET_SELECTED_PROVIDER;
          payload: {
              dataType: DataType;
              clientId: string | undefined;
          };
      }
    | {
          type: typeof METADATA.SET_ERROR_FOR_DEVICE;
          payload: { deviceState: StaticSessionId; failed: boolean };
      }
    | {
          type: typeof METADATA.ACCOUNT_ADD;
          payload: Account;
      }
    | {
          type: typeof METADATA.EXPORT_METADATA_TO_BIP329_FILE;
          payload: void;
      };

export const setAccountAdd = createAction(METADATA.ACCOUNT_ADD, (payload: Account) => ({
    payload,
}));

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

    getState().wallet.accounts.forEach(account => {
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

export const enableMetadata = (): MetadataAction => ({
    type: METADATA.ENABLE,
});

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
    { getDefaultAccountLabel: (params: GetDefaultAccountLabelParams) => string },
    void
>(METADATA.EXPORT_METADATA_TO_BIP329_FILE, ({ getDefaultAccountLabel }, { dispatch, getState }) => {
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
        const { selectedAccount } = state.wallet;
        const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(state);

        const staticSessionId = device?.state?.staticSessionId;
        if (!staticSessionId) {
            showExportErrorToast();

            return;
        }

        let finalAccountLabel = getDefaultAccountLabel({
            accountType: selectedAccount.account.accountType,
            symbol: selectedAccount.account.symbol,
            index: selectedAccount.account.index,
        });
        let labelsToExport: Bip329Label[] = [];

        if (isSuiteSyncEnabled) {
            const owner = device?.suiteSyncOwner;
            if (owner === undefined) {
                showExportErrorToast();

                return;
            }

            const { walletDescriptor } = parseDeviceStaticSessionId(
                selectedAccount.account.deviceState,
            );

            const suiteSyncAccountLabel = selectAccountLabel({
                state,
                walletDescriptor,
                accountKey: selectedAccount.account.key,
            });
            if (suiteSyncAccountLabel) {
                finalAccountLabel = suiteSyncAccountLabel;
            }

            const suiteSyncAddressLabels = selectAddressLabelsByAccount({
                state,
                deviceStaticSessionId: staticSessionId,
                accountDescriptor: selectedAccount.account.descriptor,
                networkSymbol: selectedAccount.account.symbol,
            });

            const suiteSyncOutputLabels = selectOutputLabelsByAccount({
                state,
                deviceStaticSessionId: staticSessionId,
                accountDescriptor: selectedAccount.account.descriptor,
                networkSymbol: selectedAccount.account.symbol,
            });

            labelsToExport = suiteSyncToBip329({
                outputLabels: suiteSyncOutputLabels,
                addressLabels: suiteSyncAddressLabels,
                allSpendable: true,
            });
        } else {
            // Legacy non-SuiteSync export.
            const labelForSelectedAccount = selectLabelingDataForSelectedAccount(state);
            if (labelForSelectedAccount.accountLabel) {
                finalAccountLabel = labelForSelectedAccount.accountLabel;
            }
            labelsToExport = slip15ToBip329(labelForSelectedAccount as AccountLabels);
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
});

export const exportMetadataToLocalFile = () => async (dispatch: Dispatch, getState: GetState) => {
    const providerInstance = dispatch(
        getProviderInstance({
            clientId: selectSelectedProviderForLabels(getState())!.clientId,
            dataType: 'labels',
        }),
    );

    if (!providerInstance) return;

    const filesListResult = await providerInstance.getFilesList();

    if (!filesListResult.success || !filesListResult.payload?.length) {
        dispatch(
            notificationsActions.addToast({ type: 'error', error: 'Exporting labels failed' }),
        );

        return;
    }

    const files = filesListResult.payload;

    return Promise.all(
        files.map(file =>
            providerInstance.getFileContent(file).then(result => {
                if (!result.success) throw new Error(result.error);

                return { name: file, content: result.payload };
            }),
        ),
    )
        .then(filesContent => {
            const zipBlob = createZip(filesContent);
            // Trigger download
            triggerWebDownloadFile(zipBlob, 'archive.zip');
        })
        .catch(_err => {
            dispatch(
                notificationsActions.addToast({ type: 'error', error: 'Exporting labels failed' }),
            );

            return;
        });
};
