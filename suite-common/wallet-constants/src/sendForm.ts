export const CUSTOM_FEE = 'custom' as const;
export const FIRST_OUTPUT_ID = 0;
export const BTC_LOCKTIME_SEQUENCE = 0xffffffff - 1;
export const BTC_LOCKTIME_VALUE = 500000000; // if locktime is equal/greater than this then it's a timestamp
export const BTC_RBF_SEQUENCE = 0xffffffff - 2;
export const XRP_FLAG = 0x80000000;
export const U_INT_32 = 0xffffffff;
export const ETH_BACKUP_GAS_LIMIT = '21000';
export const ERC20_BACKUP_GAS_LIMIT = '200000';
export const ERC20_TRANSFER = 'a9059cbb'; // 4 bytes function signature of solidity erc20 `transfer(address,uint256)`

export const DEFAULT_PAYMENT = {
    type: 'payment',
    address: '',
    amount: '',
    fiat: '',
    currency: { value: 'usd', label: 'USD' },
    token: null,
    label: '',
} as const;

export const DEFAULT_OPRETURN = {
    address: '',
    amount: '',
    fiat: '',
    currency: { value: 'usd', label: 'USD' },
    type: 'opreturn',
    dataAscii: '',
    token: null,
    dataHex: '',
} as const;

export const DEFAULT_VALUES = {
    setMaxOutputId: undefined,
    selectedFee: undefined,
    feePerUnit: '',
    feeLimit: '',
    options: ['broadcast'],
    bitcoinLockTime: '',
    ethereumNonce: '',
    ethereumDataAscii: '',
    ethereumDataHex: '',
    rippleDestinationTag: '',
    outputs: [],
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
} as const;

// Time-to-live (TTL) in cardano represents a slot, or deadline by which a transaction must be submitted.
// By setting offset to 7200s transaction sent from Suite will be valid for 2h.
// If it is not included in a block until then it will be rejected by the network.
export const CARDANO_DEFAULT_TTL_OFFSET = 7200;

export const COMPOSE_ERROR_TYPES = {
    COMPOSE: 'compose',
    COIN_CONTROL: 'coinControl',
    ANONYMITY: 'anonymity',
};
