import { useCallback, useRef } from 'react';
import { useStore } from 'react-redux';

import { useTranslation } from '@suite/intl';
import { type ModalRootState, type ModalState, selectModal } from '@suite/modal';
import { type UserContextPayload } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useServices } from '@trezor/dependency-injection';
import { useModuleLoader } from '@trezor/lazy-loading';
import { injectDispatch } from '@trezor/redux-utils';

import { openModalWhenSlotUnchangedThunk } from '#src/actions/suite/openModalWhenSlotUnchangedThunk';
import { getModalChunkLoader } from '#src/components/suite/modals/ReduxModal/UserContextModal/modalChunkLoaders';

/**
 * Opens a user-context modal once its chunk has arrived, so the opener can show a loading state.
 *
 * A type with no entry in `modalChunkLoaders` opens in the same commit as the click, which the
 * eager modals rely on (see `lazyUserContextModals`); an entry turns the loading state on.
 */
export const useModalLoader = () => {
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();
    /** Read through the store rather than a selector: an opener must not re-render per modal. */
    const store = useStore<ModalRootState>();
    const expectedModal = useRef<ModalState | null>(null);

    const { load, preload, isLoading } = useModuleLoader({
        toKey: (payload: UserContextPayload) => payload.type,
        getLoader: getModalChunkLoader,
        onLoaded: payload => {
            const expected = expectedModal.current;

            if (expected === null) {
                return;
            }

            dispatch(openModalWhenSlotUnchangedThunk(payload, expected));
        },
        onError: () =>
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: translationString('TR_GENERIC_ERROR_TITLE'),
                }),
            ),
    });

    /**
     * The slot is read at the click, not when the chunk lands, so that a device prompt arriving
     * in between is left alone. An opener rendered inside a modal still replaces its own.
     */
    const open = useCallback(
        (payload: UserContextPayload) => {
            expectedModal.current = selectModal(store.getState());
            load(payload);
        },
        [load, store],
    );

    return { open, preload, isLoading };
};
