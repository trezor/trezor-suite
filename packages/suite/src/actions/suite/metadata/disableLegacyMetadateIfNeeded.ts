import { DisableLegacyMetadataIfNeeded } from '@suite/suite-sync';

import * as metadataThunks from 'src/actions/suite/metadata/metadataThunks';

import { Dispatch } from '../../../types/suite';

type CreateDisableLegacyMetadataIfNeeded = { getState: () => any; dispatch: Dispatch };

/**
 * @deprecated Legacy Labeling compatibility code.
 */
export const createDisableLegacyMetadataIfNeeded =
    (deps: CreateDisableLegacyMetadataIfNeeded): DisableLegacyMetadataIfNeeded =>
    () => {
        const legacyMetadataState = deps.getState().metadata;

        if (legacyMetadataState.enabled) {
            deps.dispatch(metadataThunks.disableMetadata());
        }
    };
