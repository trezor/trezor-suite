import { createAction } from '@reduxjs/toolkit';

import { selectDevices } from '@suite-common/wallet-core';

import { METADATA } from 'src/actions/suite/constants';
import { Dispatch, GetState } from 'src/types/suite';
import {
    MetadataProvider,
    DeviceMetadata,
    Labels,
    DataType,
    WalletLabels,
    AccountLabels,
} from 'src/types/suite/metadata';
import * as metadataUtils from 'src/utils/suite/metadata';
import { selectSelectedProviderForLabels } from 'src/reducers/suite/metadataReducer';
import { Account } from '@suite-common/wallet-types';
import type { AbstractMetadataProvider } from 'src/types/suite/metadata';

export type MetadataAction =
    | { type: typeof METADATA.ENABLE }
    | { type: typeof METADATA.DISABLE }
    | { type: typeof METADATA.SET_EDITING; payload: string | undefined }
    | { type: typeof METADATA.SET_INITIATING; payload: boolean }
    | {
          type: typeof METADATA.SET_DEVICE_METADATA;
          payload: { deviceState: string; metadata: DeviceMetadata };
      }
    | {
          type: typeof METADATA.REMOVE_PROVIDER;
          payload: MetadataProvider;
      }
    | {
          type: typeof METADATA.ADD_PROVIDER;
          payload: MetadataProvider;
      }
    | {
          type: typeof METADATA.SET_DATA;
          payload: {
              provider: MetadataProvider;
              data: Record<string, Labels>;
          };
      }
    | {
          type: typeof METADATA.SET_SELECTED_PROVIDER;
          payload: {
              dataType: DataType;
              clientId: string;
          };
      }
    | {
          type: typeof METADATA.SET_ERROR_FOR_DEVICE;
          payload: { deviceState: string; failed: boolean };
      }
    | {
          type: typeof METADATA.ACCOUNT_ADD;
          payload: Account;
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

        delete updatedAccount.metadata[METADATA.ENCRYPTION_VERSION];
        dispatch(setAccountAdd(updatedAccount));
    });

    devices.forEach(device => {
        if (device.state) {
            // set metadata as disabled for this device, remove all metadata related information
            dispatch({
                type: METADATA.SET_DEVICE_METADATA,
                payload: {
                    deviceState: device.state,
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

export const setMetadata =
    ({
        provider,
        fileName,
        data,
    }: {
        provider: MetadataProvider;
        fileName: string;
        data: WalletLabels | AccountLabels | undefined;
    }) =>
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

export const encryptAndSaveMetadata = async ({
    data,
    aesKey,
    fileName,
    providerInstance,
}: {
    data: AccountLabels | WalletLabels;
    aesKey: string;
    fileName: string;
    providerInstance: AbstractMetadataProvider;
}) => {
    const encrypted = await metadataUtils.encrypt(
        {
            version: METADATA.FORMAT_VERSION,
            ...data,
        },
        aesKey,
    );

    return providerInstance.setFileContent(fileName, encrypted);
};
