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
import { type WalletDescriptor } from '@trezor/device-utils';

import * as METADATA from './metadataConstants';

export const setAccountAdd = createAction(METADATA.ACCOUNT_ADD, (payload: Account) => ({
    payload,
}));

export const enableMetadata = createAction(METADATA.ENABLE);
export const disableMetadata = createAction(METADATA.DISABLE);
export const addMetadataProvider = createAction<MetadataProvider>(METADATA.ADD_PROVIDER);
export const removeMetadataProvider = createAction<Pick<MetadataProvider, 'clientId'>>(
    METADATA.REMOVE_PROVIDER,
);
export const setDeviceMetadata = createAction<{
    deviceState: StaticSessionId;
    metadata: DeviceMetadata;
}>(METADATA.SET_DEVICE_METADATA);
export const setErrorForDevice = createAction<{
    deviceState: StaticSessionId;
    failed: boolean;
}>(METADATA.SET_ERROR_FOR_DEVICE);
export const setEditing = createAction<string | undefined>(METADATA.SET_EDITING);
export const setInitiating = createAction<boolean>(METADATA.SET_INITIATING);
export const setData = createAction<{
    provider: Omit<MetadataProvider, 'data'> & Pick<Partial<MetadataProvider>, 'data'>;
    data: Record<string, Labels | PasswordManagerState> | undefined;
}>(METADATA.SET_DATA);
export const setSelectedProvider = createAction<{
    dataType: DataType;
    clientId: string | undefined;
}>(METADATA.SET_SELECTED_PROVIDER);

export const setLegacyLabelsMigrationForWallet = createAction(
    METADATA.SET_LEGACY_LABELS_MIGRATION_FOR_WALLET,
    (walletDescriptor: WalletDescriptor) => ({ payload: { walletDescriptor } }),
);

export const metadataActions = {
    setAccountAdd,
    enableMetadata,
    disableMetadata,
    addMetadataProvider,
    removeMetadataProvider,
    setDeviceMetadata,
    setErrorForDevice,
    setEditing,
    setInitiating,
    setData,
    setSelectedProvider,
    setLegacyLabelsMigrationForWallet,
};
