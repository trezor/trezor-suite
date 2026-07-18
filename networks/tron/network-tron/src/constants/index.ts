export const TRON_DECIMALS = 6;

// Tron protocol constant: 1000 SUN per byte, charged when available bandwidth is insufficient
export const TRON_BANDWIDTH_SUN_PRICE = 1000;

// DATA_HEX_PROTOBUF_EXTRA + MAX_RESULT_SIZE_IN_TX + A_SIGNATURE
export const TRON_BANDWIDTH_FORMULA_OVERHEAD = 3 + 64 + 67;

// A memo attaches a flat fee on top of the bandwidth price.
export const TRON_MEMO_FEE_SUN = 1_000_000;

// The `getCreateAccountFee` chain parameter: a transfer that activates the recipient account
// is charged this flat fee instead of the per-byte bandwidth price, and only staked bandwidth
// (never the free daily allotment) can cover it.
export const TRON_CREATE_ACCOUNT_FEE_SUN = 100_000;

// The `getCreateNewAccountFeeInSystemContract` chain parameter: a flat 1 TRX burned when a
// transfer activates a not-yet-existing recipient account. This is separate from — and charged
// on top of — the bandwidth cost above (`TRON_CREATE_ACCOUNT_FEE_SUN`).
export const TRON_ACCOUNT_ACTIVATION_FEE_SUN = 1_000_000;
