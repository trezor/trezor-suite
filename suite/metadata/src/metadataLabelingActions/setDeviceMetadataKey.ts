import { type Dispatch } from '@reduxjs/toolkit';

import { type TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';

import * as METADATA from '../metadataConstants';
import * as METADATA_LABELING from '../metadataLabelingConstants';
import { type MetadataRootState, selectMetadata } from '../metadataReducer';
import * as metadataUtils from '../metadataUtils';

/**
 * Generate device master-key.
 */
export const setDeviceMetadataKey =
    (device: TrezorDevice, encryptionVersion = METADATA_LABELING.ENCRYPTION_VERSION) =>
    async (dispatch: Dispatch, getState: () => MetadataRootState) => {
        if (!device.state?.staticSessionId || !device.connected) return;

        const result = await TrezorConnect.cipherKeyValue({
            device: {
                path: device.path,
                state: device.state,
                instance: device.instance,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            ...METADATA_LABELING.ENCRYPTION_VERSION_CONFIGS[encryptionVersion],
        });

        if (result.success) {
            if (!selectMetadata(getState()).enabled) {
                dispatch({
                    type: METADATA.ENABLE,
                });
            }

            const { walletDescriptor } = parseStaticSessionId(device.state.staticSessionId);
            const metaKey = metadataUtils.deriveMetadataKey(result.payload.value, walletDescriptor);
            const fileName = metadataUtils.deriveFilenameForLabeling(metaKey, encryptionVersion);
            const aesKey = metadataUtils.deriveAesKey(metaKey);

            dispatch({
                type: METADATA.SET_DEVICE_METADATA,
                payload: {
                    deviceState: device.state?.staticSessionId,
                    metadata: {
                        ...device.metadata,
                        [encryptionVersion]: {
                            fileName,
                            aesKey,
                            key: result.payload.value,
                        },
                    },
                },
            });

            return { success: true };
        }

        return { success: false };
    };
