export const VALIDATION_ERRORS = {
    IS_EMPTY: 'is-empty',
    NOT_ENOUGH: 'not-enough',
    NOT_VALID: 'not-valid',
    NOT_NUMBER: 'not-number',
    NOT_HEX: 'not-hex',
    NOT_IN_RANGE: 'not-in-range',
    NOT_IN_RANGE_DECIMALS: 'not-in-range-decimals',
    XRP_CANNOT_SEND_TO_MYSELF: 'xrp-cannot-send-to-myself',
    XRP_CANNOT_SEND_LESS_THAN_RESERVE: 'xrp-cannot-send-less-than-reserve',
    NOT_ENOUGH_CURRENCY_FEE: 'not-enough-currency-fee',
} as const;

export const CUSTOM_FEE = 'custom' as const;
export const FIRST_OUTPUT_ID = 0;
export const BTC_LOCKTIME_SEQUENCE = 0xffffffff - 1;
export const BTC_RBF_SEQUENCE = 0xffffffff - 2;
export const XRP_FLAG = 0x80000000;
export const U_INT_32 = 0xffffffff;
export const ETH_DEFAULT_GAS_PRICE = '21000';
export const ETH_DEFAULT_GAS_LIMIT = '1';
export const ZEC_SIGN_ENHANCEMENT = {
    overwintered: true,
    version: 4,
    versionGroupId: 0x892f2085,
    branchId: 0xf5b9230b,
};

// UI
export const LABEL_HEIGHT = 30;

export const ERC20_TRANSFER = 'a9059cbb'; // 4 bytes function signature of solidity erc20 `transfer(address,uint256)`
export const ERC20_GAS_LIMIT = '200000';
