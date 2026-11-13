import { MessagesSchema, protobufManager } from '@trezor/protobuf';

import { loadProtobufModules } from '../../../data/protobufLoader';

// Aave WrappedTokenGateway depositETH(address,address,uint16) on Gnosis, shaped like the
// definitions the device receives.
export const AAVE_DEPOSIT_ETH_DISPLAY_FORMAT = {
    chain_id: 100,
    address: '721b9abab6511b46b9ee83a1aba23bdacb004149',
    func_sig: '474cf53d',
    intent: 'Supply',
    provider_name: 'Aave',
    parameter_definitions: [
        { atomic: MessagesSchema.EthereumABIType.ABI_ADDRESS },
        { atomic: MessagesSchema.EthereumABIType.ABI_ADDRESS },
        { atomic: MessagesSchema.EthereumABIType.ABI_UINT16 },
    ],
    field_definitions: [
        {
            path: { path: [], container_path: MessagesSchema.EthereumERC7730ContainerPath.VALUE },
            label: 'Amount to supply',
            formatter: MessagesSchema.EthereumERC7730FieldFormatterType.FORMATTER_AMOUNT,
            native_currency_address: [],
            enum_values: [],
        },
        {
            path: { path: [1] },
            label: 'Collateral recipient',
            formatter: MessagesSchema.EthereumERC7730FieldFormatterType.FORMATTER_ADDRESS_NAME,
            native_currency_address: [],
            enum_values: [],
        },
    ],
};

// A multicall(bytes[]) wrapper on Gnosis whose calls go to the wrapper itself (`@.to`).
export const MULTICALL_DISPLAY_FORMAT = {
    chain_id: 100,
    address: '66a9893cc07d91d95644aedd05d03f95e1dba8af',
    func_sig: 'ac9650d8',
    intent: 'Multicall',
    parameter_definitions: [{ array: { dynamic: MessagesSchema.EthereumABIType.ABI_BYTES } }],
    field_definitions: [
        {
            path: { path: [0] },
            label: 'Call',
            formatter: MessagesSchema.EthereumERC7730FieldFormatterType.FORMATTER_CALLDATA,
            callee_path: {
                path: [],
                container_path: MessagesSchema.EthereumERC7730ContainerPath.TO,
            },
            native_currency_address: [],
            enum_values: [],
        },
    ],
};

// sweep(address token) on the same wrapper.
export const SWEEP_DISPLAY_FORMAT = {
    chain_id: 100,
    address: '66a9893cc07d91d95644aedd05d03f95e1dba8af',
    func_sig: '01681a62',
    intent: 'Sweep',
    parameter_definitions: [{ atomic: MessagesSchema.EthereumABIType.ABI_ADDRESS }],
    field_definitions: [
        {
            path: { path: [0] },
            label: 'Token',
            formatter: MessagesSchema.EthereumERC7730FieldFormatterType.FORMATTER_ADDRESS_NAME,
            native_currency_address: [],
            enum_values: [],
        },
    ],
};

/** Hex of a `trzd1` container, as the definitions server serves it. */
export const encodeDefinition = async (
    messageType: string,
    message: Record<string, unknown>,
    definitionType = MessagesSchema.DefinitionType.ETHEREUM_DISPLAY_FORMAT,
) => {
    await loadProtobufModules();
    const { message: payload } = protobufManager.encode(messageType, message);
    const header = Buffer.alloc(12);
    header.write('trzd1', 0, 'utf8');
    header.writeUInt8(definitionType, 5);
    header.writeUInt32LE(1, 6);
    header.writeUInt16LE(payload.length, 10);

    return Buffer.concat([header, payload]).toString('hex');
};
