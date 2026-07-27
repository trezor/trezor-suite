export const SEND_MODULE_PREFIX = '@common/wallet-core/send';

// SLIP-24 payment request review screens (provider + trade details) are emitted by firmware as
// ButtonRequest_Other with these names. Unlike ConfirmOutput/SignTx they are not counted by default,
// so on bitcoin-like networks the review modal would fall back to the generic confirm screen and the
// stepper would not advance through them. Detected by name (not by the trading form flag) so the
// actual payment request confirmation drives the review, regardless of feature state.
export const PAYMENT_REQUEST_BUTTON_NAMES = ['confirm_payment_request', 'confirm_trade'];
