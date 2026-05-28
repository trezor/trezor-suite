// Mirrors firmware clear signing definitions:
// https://github.com/trezor/trezor-firmware/blob/main/core/src/apps/ethereum/clear_signing_definitions.py

const MAX_DATA_LENGTH = 6144; // 6 KB, FW memory limit for clear signing data

// ERC-20 standard functions — clear signing applies to any contract address
const GLOBAL_SELECTORS: ReadonlySet<string> = new Set([
    '095ea7b3', // approve(address,uint256)
    'a9059cbb', // transfer(address,uint256)
]);

type BoundDefinition = {
    address: string; // lowercase, no 0x prefix
    chains: ReadonlyArray<number>;
    selectors: ReadonlySet<string>;
};

const BOUND_DEFINITIONS: ReadonlyArray<BoundDefinition> = [
    {
        // LI.FI Diamond
        // https://github.com/LedgerHQ/clear-signing-erc7730-registry/blob/master/registry/lifi/calldata-LIFIDiamond.json
        address: '1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
        chains: [
            1, 10, 25, 56, 100, 106, 122, 137, 204, 250, 252, 288, 324, 1088, 1284, 1285, 5000,
            8453, 9001, 34443, 42161, 42170, 42220, 43114, 59144, 81457, 167004, 534352, 1313161554,
            1666600000,
        ],
        selectors: new Set([
            '5fd9ae2e', // swapTokensMultipleV3ERC20ToERC20
            '2c57e884', // swapTokensMultipleV3ERC20ToNative
            '736eac0b', // swapTokensMultipleV3NativeToERC20
            '4666fc80', // swapTokensSingleV3ERC20ToERC20
            '733214a3', // swapTokensSingleV3ERC20ToNative
            'af7060fd', // swapTokensSingleV3NativeToERC20
            '4630a0d8', // swapTokensGeneric
        ]),
    },
    {
        // Uniswap V3 Universal Router
        // https://github.com/LedgerHQ/clear-signing-erc7730-registry/blob/master/registry/uniswap/calldata-UniswapV3Router02.json
        address: '68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
        chains: [1],
        selectors: new Set([
            'b858183f', // exactInput(tuple)
            '04e45aaf', // exactInputSingle(tuple)
            '09b81346', // exactOutput(tuple)
            '5023b4df', // exactOutputSingle(tuple)
        ]),
    },
];

/**
 * Determines whether an EVM transaction will be shown with clear signing on the device.
 * Mirrors firmware clear signing definitions.
 *
 * `@param` chainId - The chain ID of the transaction
 * `@param` to - The recipient address (or null/undefined for contract creation)
 * `@param` data - The transaction calldata (optional, may include 0x prefix)
 * `@returns` true if the transaction qualifies for clear signing, false otherwise
 */
export const isEvmClearSigningTx = (
    chainId: number,
    to: string | null | undefined,
    data?: string,
): boolean => {
    const dataHex = data?.replace(/^0x/i, '');
    if (!dataHex || dataHex.length < 8 || dataHex.length > MAX_DATA_LENGTH * 2) {
        return false;
    }

    if (!to) return false;

    const funcSig = dataHex.slice(0, 8).toLowerCase();
    const toAddr = to.replace(/^0x/i, '').toLowerCase();

    if (GLOBAL_SELECTORS.has(funcSig)) {
        return true;
    }

    return BOUND_DEFINITIONS.some(
        def => def.address === toAddr && def.chains.includes(chainId) && def.selectors.has(funcSig),
    );
};
