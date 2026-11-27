import {
    MODAL_CONTEXT_DEVICE,
    type ModalRootState,
    REFETCH_FEES_EXCLUDED_MODAL_WINDOW_TYPES,
    selectModal,
} from '@suite/modal';

export const selectIsFeeRefetchBlockedByModal = (state: ModalRootState) => {
    const modal = selectModal(state);

    return (
        modal.context === MODAL_CONTEXT_DEVICE &&
        REFETCH_FEES_EXCLUDED_MODAL_WINDOW_TYPES.includes(modal.windowType)
    );
};
