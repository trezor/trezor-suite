import { selectDeviceByStaticSessionId } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type StaticSessionId } from '@trezor/connect';

import * as metadataLabelingActions from './metadataLabelingActions';
import * as METADATA_LABELING from './metadataLabelingConstants';
import { selectIsMetadataEnabled } from './metadataReducer';

export * from './metadataDataThunks';

export const initNewDeviceStateMetadataThunk = createThunk(
    '@suite/metadata/initNewDeviceStateMetadataThunk',
    async (staticSessionId: StaticSessionId, { getState, dispatch }) => {
        if (!selectIsMetadataEnabled(getState())) {
            return;
        }

        const device = selectDeviceByStaticSessionId(getState(), staticSessionId);
        const metadataPresentOnDevice = device?.metadata[METADATA_LABELING.ENCRYPTION_VERSION];

        if (!metadataPresentOnDevice) {
            await dispatch(metadataLabelingActions.init(false));
        }
    },
);
