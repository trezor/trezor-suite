import type {
    EthereumDisplayFormat,
    EthereumDisplayFormatField,
} from '../src/types/api/ethereum/displayFormat';

export const mockEthereumDisplayFormatField = (
    field: Pick<EthereumDisplayFormatField, 'label' | 'formatter' | 'path'> &
        Partial<EthereumDisplayFormatField>,
): EthereumDisplayFormatField => ({ nativeCurrencyAddresses: [], enumValues: [], ...field });

/** Aave's `depositETH(address,address,uint16)` on Ethereum, showing the amount the call sends. */
export const mockEthereumDisplayFormat = (
    displayFormat: Partial<EthereumDisplayFormat> = {},
): EthereumDisplayFormat => ({
    chainId: 1,
    address: '0x721b9abab6511b46b9ee83a1aba23bdacb004149',
    functionSignature: '0x474cf53d',
    intent: 'Supply',
    providerName: 'Aave',
    parameters: [
        { type: 'atomic', abiType: 'ABI_ADDRESS' },
        { type: 'atomic', abiType: 'ABI_ADDRESS' },
        { type: 'atomic', abiType: 'ABI_UINT16' },
    ],
    fields: [
        mockEthereumDisplayFormatField({
            label: 'Amount to supply',
            formatter: 'FORMATTER_AMOUNT',
            path: { type: 'container', container: 'VALUE' },
        }),
    ],
    ...displayFormat,
});
