export const VALIDATION_ERRORS = {
    IS_EMPTY: 'is-empty',
    NOT_ENOUGH: 'not-enough',
    NOT_VALID: 'not-valid',
    NOT_NUMBER: 'not-number',
    NOT_IN_RANGE: 'not-in-range',
    NOT_IN_RANGE_DECIMALS: 'not-in-range-decimals',
    BALANCE_NOT_AVAILABLE: 'balance-not-available',
} as const;

export const CUSTOM_FEE = 'custom' as const;
export const FIRST_OUTPUT_ID = 0;
export const DEFAULT_LOCAL_CURRENCY = { value: 'usd', label: 'USD' };
