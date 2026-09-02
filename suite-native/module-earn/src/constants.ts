export const EARN_MODULE_PREFIX = '@suite-native/module-earn';
export const STABLECOIN_YIELD_NATIVE_SOURCE_ORIGIN = 'trezor-suite-native://stablecoin-yield';

export const CRYPTO_BALANCE_DECIMALS = 5;
export const NETWORK_FEE_WARNING_MULTIPLIER = 4;

// The stacked crypto/fiat amount inputs are taller than the shared double-view's
// default spacing accounts for, so they overlap at the default unfocused offset.
// Earn screens push the unfocused input down further and grow the wrapper to fit.
export const AMOUNT_INPUT_UNFOCUSED_OFFSET = 64;
export const AMOUNT_INPUT_WRAPPER_HEIGHT = 128;

// Mirrors the desktop YieldAmountCard input length caps.
export const AMOUNT_INPUT_MAX_LENGTH = 30;
export const FIAT_INPUT_MAX_LENGTH = 18;

export const USER_CANCELLED_ERROR_CODES = [
    'Failure_PinCancelled',
    'Method_Cancel',
    'Failure_ActionCancelled',
] as const;
