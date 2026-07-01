// Mirrors firmware clear signing definitions:
// https://github.com/trezor/trezor-firmware/blob/main/core/src/apps/ethereum/clear_signing_definitions.py

import { versionUtils } from '@trezor/utils';

export const MAX_CLEAR_SIGNING_DATA_LENGTH = 6144; // 6 KB, FW memory limit for clear signing data

const CLEAR_SIGNING_BATCH_1_FW = '2.12.1'; // LI.FI, Uniswap
const CLEAR_SIGNING_BATCH_2_FW = '2.12.2'; // 1inch Aggregation Router V6

export type ClearSigningCoverage = 'full' | 'partial';

type SelectorDef = {
    coverage: ClearSigningCoverage;
    minFirmware: string;
};

// ERC-20 standard functions — clear signing applies to any contract address
const GLOBAL_SELECTORS: ReadonlySet<string> = new Set([
    '095ea7b3', // approve(address,uint256)
    'a9059cbb', // transfer(address,uint256)
]);

type Deployment = {
    chainId: number;
    address: string; // lowercase, no 0x prefix
    // Firmware range in which the device binds this deployment; the selector's own
    // minFirmware applies on top. minFirmware defaults to "always", maxFirmware is
    // exclusive (the release that removed the binding). Needed because firmware's
    // deployment table itself changes between releases (e.g. the LI.FI diamond on
    // zkSync moved from the canonical to a chain-specific address in 2.12.2).
    minFirmware?: string;
    maxFirmware?: string;
};

type ContractDefinition = {
    deployments: ReadonlyArray<Deployment>;
    selectors: Record<string, SelectorDef>;
};

const ONEINCH_ADDRESS = '111111125421ca6dc452d289314280a0f8842a65';
// swap(address,(address,address,address,address,uint256,uint256,uint256),bytes)
export const ONEINCH_SWAP_SELECTOR = '07ed2379';
const ONEINCH_CHAINS = [1, 10, 56, 100, 137, 146, 250, 8217, 8453, 42161, 43114, 59144, 1313161554];

// LI.FI Diamond
// https://github.com/LedgerHQ/clear-signing-erc7730-registry/blob/master/registry/lifi/calldata-LIFIDiamond.json
const LIFI_ADDRESS = '1231deb6f5749ef6ce6943a275a1d3e7486f4eae';
const LIFI_CHAINS = [
    1, 10, 25, 56, 100, 106, 122, 137, 204, 250, 252, 288, 1284, 1285, 5000, 8453, 9001, 34443,
    42161, 42170, 42220, 43114, 81457, 534352, 1313161554, 1666600000,
];
// 2.12.1 firmware binds the canonical diamond address on these chains;
// 2.12.2 replaces those bindings with the chain-specific deployments below.
const LIFI_MOVED_DEPLOYMENTS: ReadonlyArray<Deployment> = [
    { chainId: 324, address: LIFI_ADDRESS, maxFirmware: CLEAR_SIGNING_BATCH_2_FW },
    { chainId: 1088, address: LIFI_ADDRESS, maxFirmware: CLEAR_SIGNING_BATCH_2_FW },
    { chainId: 59144, address: LIFI_ADDRESS, maxFirmware: CLEAR_SIGNING_BATCH_2_FW },
    { chainId: 167004, address: LIFI_ADDRESS, maxFirmware: CLEAR_SIGNING_BATCH_2_FW },
    {
        chainId: 324,
        address: '341e94069f53234fe6dabef707ad424830525715',
        minFirmware: CLEAR_SIGNING_BATCH_2_FW,
    }, // zkSync Era
    {
        chainId: 1088,
        address: '24ca98fb6972f5ee05f0db00595c7f68d9fafd68',
        minFirmware: CLEAR_SIGNING_BATCH_2_FW,
    }, // Metis
    {
        chainId: 59144,
        address: 'de1e598b81620773454588b85d6b5d4eec32573e',
        minFirmware: CLEAR_SIGNING_BATCH_2_FW,
    }, // Linea
    {
        chainId: 167004,
        address: '3a9a5dba8fe1c4da98187ce4755701bca182f63b',
        minFirmware: CLEAR_SIGNING_BATCH_2_FW,
    }, // Taiko
];

// Uniswap V3 Universal Router
// https://github.com/LedgerHQ/clear-signing-erc7730-registry/blob/master/registry/uniswap/calldata-UniswapV3Router02.json
const UNISWAP_V3_ROUTER_ADDRESS = '68b3465833fb72a70ecdf485e0e4c7bd8665fc45';
const UNISWAP_V3_ROUTER_CHAINS = [1];

const deploymentsFor = (
    address: string,
    chains: ReadonlyArray<number>,
    extra: ReadonlyArray<Deployment> = [],
): ReadonlyArray<Deployment> => [...chains.map(chainId => ({ chainId, address })), ...extra];

const fullBatch2: SelectorDef = { coverage: 'full', minFirmware: CLEAR_SIGNING_BATCH_2_FW };
const partialBatch2: SelectorDef = { coverage: 'partial', minFirmware: CLEAR_SIGNING_BATCH_2_FW };
const fullBatch1: SelectorDef = { coverage: 'full', minFirmware: CLEAR_SIGNING_BATCH_1_FW };

const CONTRACT_DEFINITIONS: ReadonlyArray<ContractDefinition> = [
    {
        deployments: deploymentsFor(ONEINCH_ADDRESS, ONEINCH_CHAINS),
        selectors: {
            [ONEINCH_SWAP_SELECTOR]: fullBatch2, // swap
            '83800a8e': partialBatch2, // unoswap
            e2c95c82: partialBatch2, // unoswapTo
            '8770ba91': partialBatch2, // unoswap2
            '19367472': partialBatch2, // unoswap3
            ea76dddf: partialBatch2, // unoswapTo2
            f7a70056: partialBatch2, // unoswapTo3
            a76dfc3b: partialBatch2, // ethUnoswap
            '89af926a': partialBatch2, // ethUnoswap2
            '188ac35d': partialBatch2, // ethUnoswap3
            '175accdc': partialBatch2, // ethUnoswapTo
            '0f449d71': partialBatch2, // ethUnoswapTo2
            '493189f0': partialBatch2, // ethUnoswapTo3
        },
    },
    {
        deployments: deploymentsFor(LIFI_ADDRESS, LIFI_CHAINS, LIFI_MOVED_DEPLOYMENTS),
        selectors: {
            '5fd9ae2e': fullBatch1, // swapTokensMultipleV3ERC20ToERC20
            '2c57e884': fullBatch1, // swapTokensMultipleV3ERC20ToNative
            '736eac0b': fullBatch1, // swapTokensMultipleV3NativeToERC20
            '4666fc80': fullBatch1, // swapTokensSingleV3ERC20ToERC20
            '733214a3': fullBatch1, // swapTokensSingleV3ERC20ToNative
            af7060fd: fullBatch1, // swapTokensSingleV3NativeToERC20
            '4630a0d8': fullBatch1, // swapTokensGeneric
        },
    },
    {
        deployments: deploymentsFor(UNISWAP_V3_ROUTER_ADDRESS, UNISWAP_V3_ROUTER_CHAINS),
        selectors: {
            b858183f: fullBatch1, // exactInput(tuple)
            '04e45aaf': fullBatch1, // exactInputSingle(tuple)
            '09b81346': fullBatch1, // exactOutput(tuple)
            '5023b4df': fullBatch1, // exactOutputSingle(tuple)
        },
    },
];

// Flat selector -> coverage view of the definitions, for drift guards in tests.
export const CLEAR_SIGNED_SWAP_SELECTORS: ReadonlyArray<{
    selector: string;
    coverage: ClearSigningCoverage;
}> = CONTRACT_DEFINITIONS.flatMap(def =>
    Object.entries(def.selectors).map(([selector, { coverage }]) => ({ selector, coverage })),
);

const parseCalldata = (
    to: string | null | undefined,
    data?: string,
): { funcSig: string; toAddr: string } | null => {
    const dataHex = data?.replace(/^0x/i, '');

    if (
        !dataHex ||
        dataHex.length < 8 ||
        dataHex.length > MAX_CLEAR_SIGNING_DATA_LENGTH * 2 ||
        !to
    ) {
        return null;
    }

    return {
        funcSig: dataHex.slice(0, 8).toLowerCase(),
        toAddr: to.replace(/^0x/i, '').toLowerCase(),
    };
};

const findDefinition = (
    chainId: number,
    toAddr: string,
    funcSig: string,
): { selectorDef: SelectorDef; deployments: Deployment[] } | undefined => {
    const contract = CONTRACT_DEFINITIONS.find(def =>
        def.deployments.some(d => d.chainId === chainId && d.address === toAddr),
    );
    const selectorDef = contract?.selectors[funcSig];

    if (!contract || !selectorDef) {
        return undefined;
    }

    return {
        selectorDef,
        deployments: contract.deployments.filter(
            d => d.chainId === chainId && d.address === toAddr,
        ),
    };
};

const isDeploymentActive = (deployment: Deployment, firmwareVersion: string): boolean => {
    if (
        deployment.minFirmware &&
        !versionUtils.isNewerOrEqual(firmwareVersion, deployment.minFirmware)
    ) {
        return false;
    }

    if (
        deployment.maxFirmware &&
        versionUtils.isNewerOrEqual(firmwareVersion, deployment.maxFirmware)
    ) {
        return false;
    }

    return true;
};

/**
 * Determines whether an EVM transaction matches a clear signing definition of ANY
 * firmware version — some releases may not clear-sign it. Use getEvmClearSignedSwapCoverage
 * for a device-version-accurate prediction of swaps.
 *
 * `@param` chainId - The chain ID of the transaction
 * `@param` to - The recipient address (or null/undefined for contract creation)
 * `@param` data - The transaction calldata (optional, may include 0x prefix)
 * `@returns` true if the transaction matches a clear signing definition
 */
export const isEvmClearSigningTx = (
    chainId: number,
    to: string | null | undefined,
    data?: string,
): boolean => {
    const parsed = parseCalldata(to, data);
    if (!parsed) {
        return false;
    }

    if (GLOBAL_SELECTORS.has(parsed.funcSig)) {
        return true;
    }

    return findDefinition(chainId, parsed.toAddr, parsed.funcSig) !== undefined;
};

/**
 * Predicts how much of a swap the device attests: 'full' (both legs), 'partial'
 * (send leg only), or undefined when the device will not clear-sign it as a swap.
 */
export const getEvmClearSignedSwapCoverage = (
    chainId: number,
    to: string | null | undefined,
    data: string | undefined,
    firmwareVersion: string,
): ClearSigningCoverage | undefined => {
    const parsed = parseCalldata(to, data);
    if (!parsed) {
        return undefined;
    }

    const definition = findDefinition(chainId, parsed.toAddr, parsed.funcSig);
    if (!definition) {
        return undefined;
    }
    // versionUtils throws on an empty/unparseable version.
    if (!firmwareVersion) {
        return undefined;
    }
    if (!versionUtils.isNewerOrEqual(firmwareVersion, definition.selectorDef.minFirmware)) {
        return undefined;
    }
    if (!definition.deployments.some(d => isDeploymentActive(d, firmwareVersion))) {
        return undefined;
    }

    return definition.selectorDef.coverage;
};
