/**
 * Exact copy of APPROVE_KNOWN_ADDRESSES from the firmware
 * (trezor/trezor-firmware/core/src/apps/ethereum/sc_constants.py),
 */
export const EVM_SPENDER_LABELS: Record<string, string> = {
    '0x111111125421ca6dc452d289314280a0f8842a65': '1inch Aggregation Router V6',
    '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3 Router',
    '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae': 'LiFi Diamond',
};

/**
 * Exact copy of KNOWN_VAULTS from the firmware
 * (trezor/trezor-firmware/blob/main/core/src/apps/ethereum/yielding_vaults.py),
 */
export const KNOWN_VAULTS: Record<string, string> = {
    '0xe4db1c5a1b709ce4d2ada6985d9d506e58f73829': 'Trezor Steakhouse USDT Prime Vault',
    '0xde6c23e561f3e55846207ec45a91b777e0f7c889': 'Trezor Steakhouse USDC Prime Vault',
};

export const UINT256_MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
