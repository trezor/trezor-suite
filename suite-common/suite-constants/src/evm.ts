/**
 * Flattened copy of KNOWN_ADDRESSES from the firmware
 * (trezor/trezor-firmware/core/src/apps/ethereum/sc_constants.py).
 * Firmware keys the table by (chainId, address); no address carries a different
 * label on different chains, so the chain dimension is dropped here.
 */
export const EVM_SPENDER_LABELS: Record<string, string> = {
    // 1inch
    '0x111111125421ca6dc452d289314280a0f8842a65': '1inch Aggregation Router V6',
    // LI.FI
    '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae': 'LiFI Diamond',
    // Uniswap
    '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45': 'Uniswap V3 Router',
    '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3 Router',
    // Lido
    '0x889edc2edab5f40e902b864ad4d7ade8e412f9b1': 'Lido',
    '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': 'Lido',
    '0xa88f0329c2c4ce51ba3fc619bbf44efe7120dd0d': 'Lido',
    '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0': 'Lido',
    // Morpho
    '0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb': 'Morpho',
    '0x6566194141eefa99af43bb5aa71460ca2dc90245': 'Morpho',
    '0x6bfd8137e702540e7a42b74178a4a49ba43920c4': 'Morpho',
    // Kiln
    '0x576834cb068e677db4aff6ca245c7bde16c3867e': 'Kiln',
    '0x004c226fff73aa94b78a4df1a0e861797ba16819': 'Kiln',
    '0x8659eeff31cfcff580d37af8e7af250f8998aa83': 'Kiln',
    // Ethena
    '0x9d39a5de30e57443bff2a8307a4256c8797a3497': 'Ethena',
    // StarkGate
    '0xce5485cfb26914c5dce00b9baf0580364dafc7a4': 'StarkGate',
    // WalletConnect
    '0x521b4c065bbdbe3e20b3727340730936912dfa46': 'WalletConnect',
    '0xef4461891dfb3ac8572ccf7c794664a8dd927945': 'WalletConnect',
    // Core Stake
    '0x0000000000000000000000000000000000001011': 'Core Stake',
    '0x0000000000000000000000000000000000001010': 'Core Stake',
    // yield.xyz
    '0xb929b89153fc2eed442e81e5a1add4e2fa39028f': 'yield.xyz',
    '0x56d783ca8e0b998c57a428bf1c26a8baca50524e': 'yield.xyz',
    '0x857679d69fe50e7b722f94acd2629d80c355163d': 'yield.xyz',
    '0xf30cf4ed712d3734161fdaab5b1dbb49fd2d0e5c': 'yield.xyz',
    '0x5a10de50160126a5f936506bd342c541ac44e943': 'yield.xyz',
    '0x35b1ca0f398905cf752e6fe122b51c88022fca32': 'yield.xyz',
    '0xd9e6987d77bf2c6d0647b8181fd68a259f838c36': 'yield.xyz',
    '0xd14a87025109013b0a2354a775cb335f926af65a': 'yield.xyz',
    '0xa6e768fef2d1af36c0cfdb276422e7881a83e951': 'yield.xyz',
    '0x467585aaea860f9d8b3b43bb994e4da8a93788a7': 'yield.xyz',
    '0x06998af8f39ff8630d1fb515d22781da4dc2ca71': 'yield.xyz',
    '0x875e901465a639f2e71fcfc10f426ed32f5a909a': 'yield.xyz',
    '0x2905b3387c9550ea57fa3ee7d4b7e5abf3acd3d2': 'yield.xyz',
    '0x15c2b3adca66e26b6f230b4023f52a285b7f9995': 'yield.xyz',
};

export const UINT256_MAX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
