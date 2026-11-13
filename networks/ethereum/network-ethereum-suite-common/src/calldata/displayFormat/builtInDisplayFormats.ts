import type {
    EthereumDisplayFormat,
    EthereumDisplayFormatAbiValue,
    EthereumDisplayFormatField,
} from '@trezor/connect-common';

// Definitions the firmware carries itself, so it decodes these embedded calls without a download:
// https://github.com/trezor/trezor-firmware/blob/main/core/src/apps/ethereum/clear_signing_definitions.py

type BuiltInDisplayFormat = Pick<
    EthereumDisplayFormat,
    'functionSignature' | 'intent' | 'providerName' | 'parameters' | 'fields'
>;

const ADDRESS: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_ADDRESS' };
const UINT256: EthereumDisplayFormatAbiValue = { type: 'atomic', abiType: 'ABI_UINT256' };

const createField = (
    field: Pick<EthereumDisplayFormatField, 'label' | 'formatter' | 'path'> &
        Partial<EthereumDisplayFormatField>,
): EthereumDisplayFormatField => ({ nativeCurrencyAddresses: [], enumValues: [], ...field });

// Any ERC-20 contract.
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

// The chain's WETH contract only.
const WRAPPED_NATIVE_DISPLAY_FORMATS: BuiltInDisplayFormat[] = [
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

type GetBuiltInSubcallDisplayFormatParams = {
    selector: string;
    isWrappedNative: boolean;
};

export const getBuiltInSubcallDisplayFormat = ({
    selector,
    isWrappedNative,
}: GetBuiltInSubcallDisplayFormatParams): BuiltInDisplayFormat | undefined =>
    [...TOKEN_DISPLAY_FORMATS, ...(isWrappedNative ? WRAPPED_NATIVE_DISPLAY_FORMATS : [])].find(
        ({ functionSignature }) => functionSignature === selector,
    );
