import type {
    EthereumDisplayFormat,
    EthereumDisplayFormatAbiValue,
    EthereumDisplayFormatField,
} from '../types/api/ethereum/displayFormat';

// Definitions the firmware carries itself, so it decodes these calls without a download:
// https://github.com/trezor/trezor-firmware/blob/main/core/src/apps/ethereum/clear_signing_definitions.py

export type BuiltInDisplayFormat = Pick<
    EthereumDisplayFormat,
    'functionSignature' | 'intent' | 'providerName' | 'parameters' | 'fields'
>;

type Deployment = {
    chainId: number;
    // Lowercase, without the 0x prefix.
    address: string;
};

// Firmware `sc_constants.weth_deployments`: only these hold the chain's native currency, so other
// wrapped-native tokens (WBNB, WPOL, WAVAX…) get no built-in deposit/withdraw.
const WETH_DEPLOYMENTS: ReadonlyArray<Deployment> = [
    { chainId: 1, address: 'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' }, // ethereum
    { chainId: 10, address: '4200000000000000000000000000000000000006' }, // optimism
    { chainId: 42161, address: '82af49447d8a07e3bd95bd0d56f35241523fbab1' }, // arbitrum
    { chainId: 8453, address: '4200000000000000000000000000000000000006' }, // base
    { chainId: 11155111, address: '7b79995e5f793a07bc00c21412e50ecae098e7f9' }, // sepolia
    { chainId: 17000, address: '94373a4919b3240d86ea41593d5eba789fef3848' }, // holesky
];

const ADDRESS: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_ADDRESS' };
const UINT256: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_UINT256' };

const createField = (
    field: Pick<EthereumDisplayFormatField, 'label' | 'formatter' | 'path'> &
        Partial<EthereumDisplayFormatField>,
): EthereumDisplayFormatField => ({ nativeCurrencyAddresses: [], enumValues: [], ...field });

// Bound to any contract.
const TOKEN_DISPLAY_FORMATS: BuiltInDisplayFormat[] = [
    {
        functionSignature: '0x095ea7b3', // approve(address,uint256)
        intent: 'Approve',
        parameters: [ADDRESS, UINT256],
        fields: [
            createField({
                label: 'Spender',
                formatter: 'FORMATTER_ADDRESS_NAME',
                path: { type: 'data', steps: [0] },
            }),
            createField({
                label: 'Amount',
                formatter: 'FORMATTER_TOKEN_AMOUNT',
                path: { type: 'data', steps: [1] },
                tokenPath: { type: 'container', container: 'TO' },
                threshold: `0x8${'0'.repeat(63)}`,
            }),
        ],
    },
    {
        functionSignature: '0xa9059cbb', // transfer(address,uint256)
        intent: 'Send',
        parameters: [ADDRESS, UINT256],
        fields: [
            createField({
                label: 'To',
                formatter: 'FORMATTER_ADDRESS_NAME',
                path: { type: 'data', steps: [0] },
            }),
            createField({
                label: 'Amount',
                formatter: 'FORMATTER_TOKEN_AMOUNT',
                path: { type: 'data', steps: [1] },
                tokenPath: { type: 'container', container: 'TO' },
            }),
        ],
    },
];

// Bound to `WETH_DEPLOYMENTS` only.
const WETH_DISPLAY_FORMATS: BuiltInDisplayFormat[] = [
    {
        functionSignature: '0xd0e30db0', // deposit()
        intent: 'Wrap ETH to WETH',
        parameters: [],
        fields: [
            createField({
                label: 'Amount',
                formatter: 'FORMATTER_AMOUNT',
                path: { type: 'container', container: 'VALUE' },
            }),
        ],
    },
    {
        functionSignature: '0x2e1a7d4d', // withdraw(uint256)
        intent: 'Unwrap WETH to ETH',
        parameters: [UINT256],
        fields: [
            createField({
                label: 'Amount',
                formatter: 'FORMATTER_AMOUNT',
                path: { type: 'data', steps: [0] },
            }),
        ],
    },
];

const toBareLowercaseHex = (hex: string) => hex.toLowerCase().replace(/^0x/, '');

// Firmware 2.12.4 also had 1inch Aggregation Router V6 and Uniswap V3 Router definitions built in
// (`clear_signing_definitions.py` at core/v2.12.4). Suite does not mirror them.
const SWAP_BUILT_IN_CALLS: ReadonlyArray<{
    chainIds: ReadonlyArray<number>;
    address: string;
    selectors: ReadonlyArray<string>;
}> = [
    {
        chainIds: [1, 10, 56, 100, 137, 146, 250, 8217, 8453, 42161, 43114, 59144, 1313161554],
        address: '111111125421ca6dc452d289314280a0f8842a65',
        selectors: [
            '07ed2379',
            '83800a8e',
            'e2c95c82',
            '8770ba91',
            '19367472',
            'ea76dddf',
            'f7a70056',
            'a76dfc3b',
            '89af926a',
            '188ac35d',
            '175accdc',
            '0f449d71',
            '493189f0',
        ],
    },
    {
        chainIds: [1],
        address: '68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
        selectors: ['b858183f', '04e45aaf', '09b81346', '5023b4df'],
    },
];

type BuiltInDisplayFormatCall = {
    chainId: number;
    // Hex, with or without the 0x prefix.
    address: string;
    functionSignature: string;
};

const isWethDeployment = (chainId: number, address: string) =>
    WETH_DEPLOYMENTS.some(
        deployment =>
            deployment.chainId === chainId && deployment.address === toBareLowercaseHex(address),
    );

/** The definition the firmware has built in for the call; the device prefers it to any download. */
export const getBuiltInDisplayFormat = ({
    chainId,
    address,
    functionSignature,
}: BuiltInDisplayFormatCall): BuiltInDisplayFormat | undefined => {
    const selector = `0x${toBareLowercaseHex(functionSignature)}`;
    const candidates = isWethDeployment(chainId, address)
        ? [...TOKEN_DISPLAY_FORMATS, ...WETH_DISPLAY_FORMATS]
        : TOKEN_DISPLAY_FORMATS;

    return candidates.find(displayFormat => displayFormat.functionSignature === selector);
};

/** Whether firmware with swap built-ins decodes the call with one of them instead. */
export const isSwapBuiltInDisplayFormatCall = ({
    chainId,
    address,
    functionSignature,
}: BuiltInDisplayFormatCall) =>
    SWAP_BUILT_IN_CALLS.some(
        call =>
            call.chainIds.includes(chainId) &&
            call.address === toBareLowercaseHex(address) &&
            call.selectors.includes(toBareLowercaseHex(functionSignature)),
    );
