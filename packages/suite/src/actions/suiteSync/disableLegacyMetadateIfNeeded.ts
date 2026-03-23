import { type Dispatch } from '@reduxjs/toolkit';

import { metadataThunks } from '@suite/metadata';
import { type DisableLegacyMetadataIfNeeded } from '@suite/suite-sync';

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
