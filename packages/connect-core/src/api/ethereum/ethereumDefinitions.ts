import fetch from 'cross-fetch';

import {
    type EthereumDisplayFormat,
    type EthereumDisplayFormatAbiValue,
    type EthereumDisplayFormatField,
    type EthereumDisplayFormatPath,
    type EthereumNetworkInfoDefinitionValues,
    getEthereumDefinitionsBaseUrl,
} from '@trezor/connect-common';
import { MessagesSchema, protobufManager } from '@trezor/protobuf';
import { trzd } from '@trezor/protocol';
import type { Static } from '@trezor/schema-utils';
import { Assert, Type } from '@trezor/schema-utils';

import { ethereumNetworkInfoBase } from '../../data/coinInfo';
import * as settingsStore from '../../data/settingsStore';
import type { DefinitionsVersion } from '../../utils/definitionsUtils';

interface GetEthereumDefinitions {
    chainId?: number;
    slip44?: number;
    contractAddress?: string;
    functionSignature?: string;
    // Definitions sent to the device must match its format version. The default v1 is enough
    // to decode the content before the device is known.
    version?: DefinitionsVersion;
}

/**
 * For given chainId and optionally contractAddress download ethereum definitions for transaction signing.
 * Definitions are only required to display correct information on display. If definitions
 * are not provided UNKNOWN is shown. This means that should this method fail we only log this but don't return error.
 */
export const getEthereumDefinitions = async ({
    chainId,
    slip44,
    contractAddress,
    functionSignature,
    version = 1,
}: GetEthereumDefinitions) => {
    const definitions: MessagesSchema.EthereumDefinitions = {};

    if (!chainId && !slip44) {
        throw new Error('argument chainId or slip44 is required');
    }

    // The channel is a global connect setting; fall back to `production` when settings are not
    // loaded (e.g. when this helper is exercised outside of a running connect core).
    const channel = settingsStore.isLoaded() ? settingsStore.get('definitionsChannel') : undefined;
    const baseUrl = getEthereumDefinitionsBaseUrl(version, channel);

    try {
        const networkDefinitionUrl = `${baseUrl}/${chainId ? 'chain-id' : 'slip44'}/${chainId ?? slip44}/network.dat`;
        const networkDefinition = await fetch(networkDefinitionUrl);
        if (networkDefinition.status === 200) {
            definitions.encoded_network = await networkDefinition.arrayBuffer();
        } else if (networkDefinition.status !== 404) {
            throw new Error(`unexpected status: ${networkDefinition.status}`);
        }
    } catch (err) {
        console.warn(`unable to download or parse ${chainId} definition. detail: ${err.message}`);
    }

    try {
        if (contractAddress) {
            // Contract address has to be in lowercase in order to be found in definitions/eth.
            const lowerCaseContractAddress = contractAddress.toLowerCase();
            const tokenDefinitionUrl = `${baseUrl}/${chainId ? 'chain-id' : 'slip44'}/${chainId ?? slip44}/token-${lowerCaseContractAddress}.dat`;
            const tokenDefinition = await fetch(tokenDefinitionUrl);
            if (tokenDefinition.status === 200) {
                definitions.encoded_token = await tokenDefinition.arrayBuffer();
            } else if (tokenDefinition.status !== 404) {
                throw new Error(`unexpected status: ${tokenDefinition.status}`);
            }
        }
    } catch (err) {
        console.warn(
            `unable to download or parse ${chainId}/${contractAddress} definition. detail: ${err.message}`,
        );
    }

    try {
        // Clear-signing (display-format) definitions
        if (chainId && contractAddress && functionSignature) {
            const lowerCaseContractAddress = contractAddress.toLowerCase();
            const lowerCaseFunctionSignature = functionSignature.toLowerCase();
            const displayFormatUrl = `${baseUrl}/chain-id/${chainId}/display-format/${lowerCaseContractAddress}-${lowerCaseFunctionSignature}.dat`;
            const displayFormatDefinition = await fetch(displayFormatUrl);
            if (displayFormatDefinition.status === 200) {
                const encodedDisplayFormat = await displayFormatDefinition.arrayBuffer();
                definitions.encoded_display_format =
                    Buffer.from(encodedDisplayFormat).toString('hex');
            } else if (displayFormatDefinition.status !== 404) {
                throw new Error(`unexpected status: ${displayFormatDefinition.status}`);
            }
        }
    } catch (err) {
        console.warn(
            `unable to download or parse ${chainId}/${contractAddress}/${functionSignature} display-format definition. detail: ${err.message}`,
        );
    }

    return definitions;
};

/**
 * decoded content of data retrieved from https://data.trezor.io/firmware/definitions/eth/...
 */
export type EthereumNetworkDefinitionDecoded = Static<typeof EthereumNetworkDefinitionDecoded>;
export const EthereumNetworkDefinitionDecoded = Type.Object({
    chain_id: Type.Number(),
    name: Type.String(),
    slip44: Type.Number(),
    symbol: Type.String(),
});

/**
 * decoded content of data retreived from https://data.trezor.io/firmware/definitions/eth/...
 */
export type EthereumTokenDefinitionDecoded = Static<typeof EthereumTokenDefinitionDecoded>;
export const EthereumTokenDefinitionDecoded = Type.Object({
    address: Type.String(), // dac17f958d2ee523a2206206994597c13d831ec7
    chain_id: Type.Number(), // 1
    decimals: Type.Number(), // 6
    name: Type.String(), // Tether
    symbol: Type.String(), // USDT
});

export type EthereumDefinitionDecoded = Static<typeof EthereumDefinitionDecoded>;
export const EthereumDefinitionDecoded = Type.Object({
    network: Type.Optional(EthereumNetworkDefinitionDecoded),
    token: Type.Optional(EthereumTokenDefinitionDecoded),
});

export const decodeEthereumDefinition = (
    encodedDefinition: MessagesSchema.EthereumDefinitions,
): EthereumDefinitionDecoded => {
    const decoded: EthereumDefinitionDecoded = {
        network: undefined,
        token: undefined,
    };

    (['encoded_token', 'encoded_network'] as const).forEach(key => {
        const encodedPayload = encodedDefinition[key];

        if (!encodedPayload) {
            // this should never happen as long as types are safe
            return;
        }

        const { definitionType, protobufPayload } = trzd.decode(encodedPayload);
        const { message: decodedDefinition } = protobufManager.decode(
            definitionType === 0 ? 'EthereumNetworkInfo' : 'EthereumTokenInfo',
            protobufPayload,
        );

        if (key === 'encoded_network') {
            Assert(EthereumNetworkDefinitionDecoded, decodedDefinition);
            decoded.network = decodedDefinition;
        } else if (key === 'encoded_token') {
            Assert(EthereumTokenDefinitionDecoded, decodedDefinition);
            decoded.token = decodedDefinition;
        }
    });

    return decoded;
};

// protobufManager decodes enums to their names, bytes to unprefixed hex, an absent scalar to null
// and an absent sub-message to {}.
type DecodedMessage = Record<string, any>;

const isPresent = (message: DecodedMessage | null | undefined): message is DecodedMessage =>
    !!message && Object.keys(message).length > 0;

const toHex = (bytes: string) => `0x${bytes}`;

const decodeAbiValue = (value: DecodedMessage): EthereumDisplayFormatAbiValue => {
    if (value.atomic !== null) {
        return { type: 'atomic', abiType: value.atomic };
    }
    if (value.dynamic !== null) {
        return { type: 'dynamic', abiType: value.dynamic };
    }
    if (isPresent(value.tuple)) {
        return { type: 'tuple', fields: value.tuple.fields.map(decodeAbiValue) };
    }
    if (isPresent(value.array)) {
        return { type: 'array', element: decodeAbiValue(value.array) };
    }
    throw new Error('ABI value without a type');
};

// Mirrors the firmware: a container path wins over a constant, which wins over a data path.
const decodeDisplayFormatPath = (path: DecodedMessage): EthereumDisplayFormatPath => {
    if (path.container_path !== null) {
        return { type: 'container', container: path.container_path };
    }
    if (path.const_value !== null) {
        return { type: 'const', value: path.const_value };
    }
    if (path.slice_end !== null) {
        return {
            type: 'data',
            steps: path.path,
            slice: { start: path.slice_start ?? 0, end: path.slice_end },
        };
    }
    if (path.slice_start !== null) {
        return { type: 'data', steps: path.path, slice: { start: path.slice_start } };
    }

    return { type: 'data', steps: path.path };
};

const decodeDisplayFormatField = (field: DecodedMessage): EthereumDisplayFormatField => ({
    label: field.label,
    formatter: field.formatter,
    path: decodeDisplayFormatPath(field.path),
    tokenPath: isPresent(field.token_path) ? decodeDisplayFormatPath(field.token_path) : undefined,
    constTokenAddress: field.const_token_address ? toHex(field.const_token_address) : undefined,
    nativeCurrencyAddresses: field.native_currency_address.map(toHex),
    threshold: field.threshold ? toHex(field.threshold) : undefined,
    thresholdMessage: field.threshold_message ?? undefined,
    decimals: field.decimals ?? undefined,
    base: field.base ?? undefined,
    prefix: field.prefix ?? undefined,
    calleePath: isPresent(field.callee_path)
        ? decodeDisplayFormatPath(field.callee_path)
        : undefined,
    enumValues: field.enum_values,
});

/**
 * Decodes the clear-signing definition of a contract call. Its schema is recursive, so it is not
 * part of the generated protobuf types and is decoded by hand.
 */
export const decodeEthereumDisplayFormat = (encodedHex: string): EthereumDisplayFormat => {
    const encoded = Buffer.from(encodedHex, 'hex');
    const { definitionType, protobufPayload } = trzd.decode(
        encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength),
    );
    if (definitionType !== MessagesSchema.DefinitionType.ETHEREUM_DISPLAY_FORMAT) {
        throw new Error(`unexpected definition type: ${definitionType}`);
    }

    const { message } = protobufManager.decode('EthereumDisplayFormatInfo', protobufPayload);
    const info = message as DecodedMessage;

    return {
        chainId: info.chain_id,
        address: toHex(info.address),
        functionSignature: toHex(info.func_sig),
        intent: info.intent,
        providerName: info.provider_name ?? undefined,
        parameters: info.parameter_definitions.map(decodeAbiValue),
        fields: info.field_definitions.map(decodeDisplayFormatField),
    };
};

export const ethereumNetworkInfoFromDefinition = (
    definition: EthereumNetworkDefinitionDecoded,
): EthereumNetworkInfoDefinitionValues => ({
    ...ethereumNetworkInfoBase,
    chainId: definition.chain_id,
    label: definition.name,
    name: definition.name,
    slip44: definition.slip44,
    shortcut: definition.symbol,
    support: {
        T1B1: '1.6.2',
        T2T1: '2.0.7',
        T2B1: '2.0.0',
        T3B1: '2.0.0',
        T3T1: '2.0.0',
        T3W1: '2.0.0',
        UNKNOWN: '0.0.0',
    },
    blockchainLink: undefined,
});
