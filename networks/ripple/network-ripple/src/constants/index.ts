export * from './accountTransactions';
export * from './decimals';
export * from './serverInfo';
export * from './timestamp';

// Network default reserves in drops, overwritten at runtime from `server_info`.
export const RIPPLE_BASE_RESERVE_DEFAULT = '10000000'; // 10 XRP
export const RIPPLE_OWNER_RESERVE_DEFAULT = '2000000'; // 2 XRP

// Destination tags are uint32: max 4294967295, which is 10 decimal digits.
export const RIPPLE_DESTINATION_TAG_MAX_DIGITS = 10;

// tfFullyCanonicalSig — XRPL universal transaction flag
export const XRP_FLAG = 0x80000000;
