import { UI_REQUEST } from '@trezor/connect';

export const MODAL_CLOSE = '@modal/close' as const;
export const MODAL_CONTEXT_NONE = '@modal/context-none' as const;
export const MODAL_CONTEXT_DEVICE = '@modal/context-device' as const;
export const MODAL_CONTEXT_DEVICE_CONFIRMATION = '@modal/context-device-confirmation' as const;
export const MODAL_OPEN_USER_CONTEXT = '@modal/open-user-context' as const;
export const MODAL_CONTEXT_USER = '@modal/context-user' as const;
export const MODAL_PRESERVE = '@modal/preserve' as const;
export const MODAL_REMOVE_PRESERVE = '@modal/remove_preserve' as const;

export const REFETCH_FEES_EXCLUDED_MODAL_WINDOW_TYPES = [
    UI_REQUEST.REQUEST_PASSPHRASE,
    // both are TransactionReviewModal, which should be final and not be subject to sudden change!
    'ButtonRequest_ConfirmOutput',
    'ButtonRequest_SignTx',
];
