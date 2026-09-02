import { MODAL_CONTEXT_DEVICE_CONFIRMATION } from './constants';

type SelectModalConfirmationRequestIdState = {
    modal: {
        context: string;
        requestId?: string;
    };
};

export const selectModalConfirmationRequestId = (state: SelectModalConfirmationRequestIdState) =>
    state.modal.context === MODAL_CONTEXT_DEVICE_CONFIRMATION ? state.modal.requestId : undefined;
