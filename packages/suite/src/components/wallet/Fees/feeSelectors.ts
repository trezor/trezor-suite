import {
    MODAL_CONTEXT_DEVICE,
    type ModalRootState,
    REFETCH_FEES_EXCLUDED_MODAL_WINDOW_TYPES,
} from '@suite/modal';

export const selectIsFeeRefetchBlockedByModal = (state: ModalRootState) =>
    state.modal.context === MODAL_CONTEXT_DEVICE &&
    state.modal.windowType !== undefined &&
    REFETCH_FEES_EXCLUDED_MODAL_WINDOW_TYPES.includes(state.modal.windowType);
