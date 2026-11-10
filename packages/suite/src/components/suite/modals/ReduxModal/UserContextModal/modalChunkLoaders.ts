import { type UserContextPayload } from '@suite-common/suite-types';

type ModalChunkLoader = () => Promise<unknown>;

/**
 * Each loader is the literal `import()` its `lazy()` below uses, so webpack resolves the two to one
 * chunk and one module promise. Awaiting a loader therefore leaves the `lazy()` nothing to fetch,
 * which is what lets an opener report a loading state without the modal loading twice.
 */
export const loadApplicationLogModal = () =>
    import(/* webpackChunkName: "modals-user" */ './ApplicationLogModal');
export const loadBackgroundGalleryModal = () =>
    import(/* webpackChunkName: "modals-user" */ './BackgroundGalleryModal');
export const loadSafetyChecksModal = () =>
    import(/* webpackChunkName: "modals-user" */ './SafetyChecksModal');

/**
 * Only the modals whose opener awaits them need an entry. `useModalLoader` dispatches straight away
 * for every other type, so adding an entry here is what turns a button's loading state on.
 */
const MODAL_CHUNK_LOADERS: Partial<Record<UserContextPayload['type'], ModalChunkLoader>> = {
    'application-log': loadApplicationLogModal,
    'device-background-gallery': loadBackgroundGalleryModal,
    'safety-checks': loadSafetyChecksModal,
};

export const getModalChunkLoader = (type: UserContextPayload['type']) => MODAL_CHUNK_LOADERS[type];
