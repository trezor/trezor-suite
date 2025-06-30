import { UI } from "@trezor/connect";

export const CLOSE = '@modal/close';
export const CONTEXT_NONE = '@modal/context-none';
export const CONTEXT_DEVICE = '@modal/context-device';
export const CONTEXT_DEVICE_CONFIRMATION = '@modal/context-device-confirmation';
export const OPEN_USER_CONTEXT = '@modal/open-user-context';
export const CONTEXT_USER = '@modal/context-user';
export const PRESERVE = '@modal/preserve';

export const REFETCH_FEES_EXCLUDED_MODAL_WINDOW_TYPES = [
    UI.REQUEST_PASSPHRASE,
    // both are TransactionReviewModal, which should be final and not be subject to sudden change!
    'ButtonRequest_ConfirmOutput',
    'ButtonRequest_SignTx',
];
