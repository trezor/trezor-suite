import { type Dispatch } from '@reduxjs/toolkit';

import { selectDevices } from '@suite-common/device';
import {
    type AbstractMetadataProvider,
    type AccountLabels,
    type MetadataProvider,
    type PasswordManagerState,
    type WalletLabels,
} from '@suite-common/metadata-types';
import { selectAccounts } from '@suite-common/wallet-core';

import {
    disableMetadata as disableMetadataAction,
    setAccountAdd,
    setDeviceMetadata,
} from './metadataActions';
import * as METADATA from './metadataConstants';
import * as METADATA_LABELING from './metadataLabelingConstants';
import { type MetadataRootState, selectSelectedProviderForLabels } from './metadataReducer';
import * as metadataUtils from './metadataUtils';

type DisposeMetadataThunkState = MetadataRootState;

/**
 * dispose metadata from all labelable objects.
 */
export const disposeMetadata =
    () => (dispatch: Dispatch, getState: () => DisposeMetadataThunkState) => {
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

type DisposeMetadataKeysThunkState = MetadataRootState;

export const disposeMetadataKeys =
    () => (dispatch: Dispatch, getState: () => DisposeMetadataKeysThunkState) => {
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
                dispatch(
                    setDeviceMetadata({
                        deviceState: device.state.staticSessionId,
                        metadata: {},
                    }),
                );
            }
        });
    };

export const disableMetadata = () => (dispatch: Dispatch) => {
    dispatch(disableMetadataAction());

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
