import { type Dispatch } from '@reduxjs/toolkit';

import { selectDevices } from '@suite-common/device';

import * as METADATA_LABELING from '../metadataLabelingConstants';
import { type MetadataRootState, selectMetadata } from '../metadataReducer';
import { fetchAndSaveMetadata } from './fetchAndSaveMetadata';

export const fetchAndSaveMetadataForAllDevices =
    () => (dispatch: Dispatch, getState: () => MetadataRootState) => {
        const metadata = selectMetadata(getState());
        if (!metadata.enabled) {
            return;
        }
        const devices = selectDevices(getState());
        devices.forEach(device => {
            if (
                !device.state?.staticSessionId ||
                !device.metadata[METADATA_LABELING.ENCRYPTION_VERSION]
            )
                return;
            dispatch(fetchAndSaveMetadata(device.state.staticSessionId));
        });
    };
