import { type UserContextPayload } from '@suite-common/suite-types';

import {
    loadApplicationLogModal,
    loadBackgroundGalleryModal,
    loadSafetyChecksModal,
} from './lazyUserContextModals';

type ModalChunkLoader = () => Promise<unknown>;

/**
 * Only modals whose opener awaits them need an entry; every other type dispatches straight away.
 * Each loader comes from the same `lazyComponentByName` call as its boundary, so they cannot drift.
 */
const MODAL_CHUNK_LOADERS: Partial<Record<UserContextPayload['type'], ModalChunkLoader>> = {
    'application-log': loadApplicationLogModal,
    'device-background-gallery': loadBackgroundGalleryModal,
    'safety-checks': loadSafetyChecksModal,
};

export const getModalChunkLoader = (type: UserContextPayload['type']) => MODAL_CHUNK_LOADERS[type];
