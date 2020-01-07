import {
    BUTTON_REQUEST__PROTECT_CALL,
    BUTTON_REQUEST__CONFIRM_WORD,
    BUTTON_REQUEST__WIPE_DEVICE,
    BUTTON_REQUEST__RESET_DEVICE,
    BUTTON_REQUEST__MNEMONIC_WORD_COUNT,
    BUTTON_REQUEST__MNEMONIC_INPUT,
    BUTTON_REQUEST__OTHER,
    WORD_REQUEST_PLAIN,
    WORD_REQUEST_MATRIX9,
    WORD_REQUEST_MATRIX6,
} from '@onboarding-actions/constants/events';

export type AnyEvent =
    | typeof BUTTON_REQUEST__PROTECT_CALL
    | typeof BUTTON_REQUEST__CONFIRM_WORD
    | typeof BUTTON_REQUEST__WIPE_DEVICE
    | typeof BUTTON_REQUEST__RESET_DEVICE
    | typeof BUTTON_REQUEST__MNEMONIC_WORD_COUNT
    | typeof BUTTON_REQUEST__MNEMONIC_INPUT
    | typeof BUTTON_REQUEST__OTHER
    | typeof WORD_REQUEST_PLAIN
    | typeof WORD_REQUEST_MATRIX9
    | typeof WORD_REQUEST_MATRIX6;
