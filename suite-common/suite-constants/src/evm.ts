/**
 * Exact copy of APPROVE_KNOWN_ADDRESSES from the firmware
 * (trezor/trezor-firmware/core/src/apps/ethereum/sc_constants.py),
 */
export const EVM_SPENDER_LABELS: Record<string, string> = {
    '0x111111125421ca6dc452d289314280a0f8842a65': '1inch Aggregation Router V6',
    '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3 Router',
    '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': 'Uniswap V3 Router',
    '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae': 'LiFI Diamond',
};

export const UINT256_MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
