import { createAction } from '@reduxjs/toolkit';

import {
    type DataType,
    type DeviceMetadata,
    type Labels,
    type MetadataProvider,
    type PasswordManagerState,
} from '@suite-common/metadata-types';
import { type Account } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';

import * as METADATA from './metadataConstants';

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

export const enableMetadata = (): MetadataAction => ({
    type: METADATA.ENABLE,
});

export const metadataActions = {
    setAccountAdd,
    enableMetadata,
};
