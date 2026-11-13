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
