import {
    MODAL_CONTEXT_DEVICE,
    type ModalRootState,
    REFETCH_FEES_EXCLUDED_MODAL_WINDOW_TYPES,
    selectModalContext,
} from '@suite/modal';

export const selectIsFeeRefetchBlockedByModal = (state: ModalRootState) =>
    selectModalContext(state) === MODAL_CONTEXT_DEVICE &&
    REFETCH_FEES_EXCLUDED_MODAL_WINDOW_TYPES.includes(state.modal.windowType);
