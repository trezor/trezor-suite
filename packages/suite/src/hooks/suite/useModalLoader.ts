import { useCallback } from 'react';

import { useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { useMutation } from '@suite-common/react-query';
import { type UserContextPayload } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { getModalChunkLoader } from '#src/components/suite/modals/ReduxModal/UserContextModal/modalChunkLoaders';

/** A chunk lost to a flaky connection is worth retrying before the modal gives up on it. */
const CHUNK_LOAD_RETRIES = 2;

/**
 * Opens a user-context modal once its code chunk has arrived, so the opener can report a loading
 * state rather than looking inert while the chunk is in flight.
 *
 * Loading the chunk is a mutation because it is imperative and user-triggered: `useQuery` fetches
 * on mount, which would turn every opener that rendered into a prefetch of its modal.
 *
 * A chunk that never arrives leaves the modal closed behind a toast, rather than reaching the
 * `lazy()` boundary, whose rejection takes the whole app to the error screen and stays cached
 * until a reload.
 */
export const useModalLoader = () => {
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();

    const { mutate: loadModalChunk, isPending } = useMutation({
        // The module is not kept: `lazy()` imports it again from webpack's cache, so this only
        // has to wait for the chunk to arrive.
        mutationFn: async (payload: UserContextPayload) => {
            await getModalChunkLoader(payload.type)?.();
        },
        retry: CHUNK_LOAD_RETRIES,
        onSuccess: (_, payload) => dispatch(openModal(payload)),
        onError: () =>
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: translationString('TR_GENERIC_ERROR_TITLE'),
                }),
            ),
    });

    const open = useCallback(
        (payload: UserContextPayload) => {
            /**
             * A modal with no chunk to wait for opens in this same commit. ActivateAssetsModal,
             * AddAccountModal and TransactionReviewModal set `state.modal.preserve` from a mount
             * effect, and deferring their dispatch by even a tick would delay that past
             * UI_EVENTS.CLOSE_UI_WINDOW, which is why they are eager to begin with.
             */
            if (!getModalChunkLoader(payload.type)) {
                dispatch(openModal(payload));

                return;
            }

            loadModalChunk(payload);
        },
        [dispatch, loadModalChunk],
    );

    /**
     * Fetches a modal's chunk before the click that needs it, so an opener that was hovered or
     * tabbed to usually has nothing left to wait for.
     *
     * A failed preload is deliberately silent: webpack drops a chunk it could not fetch from its
     * registry, so the click requests it again, and the mutation above owns the retries and the
     * error toast.
     */
    const preload = useCallback((type: UserContextPayload['type']) => {
        getModalChunkLoader(type)?.().catch(() => undefined);
    }, []);

    return { open, preload, isLoading: isPending };
};
