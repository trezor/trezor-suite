import fetch from 'cross-fetch';

import { VersionArray } from '@trezor/device-utils';
import { MessagesSchema, decodeMessage, parseConfigure } from '@trezor/protobuf';
import { trzd } from '@trezor/protocol';
import { Assert, Static, Type } from '@trezor/schema-utils';
import { isNewerOrEqual } from '@trezor/utils/src/versionUtils';

import { DataManager } from '../../data/DataManager';
import { ethereumNetworkInfoBase } from '../../data/coinInfo';
import { EthereumNetworkInfoDefinitionValues } from '../../types';

// Format version of the signed definitions. The payloads are identical, but Trezor One firmware
// 1.14.2 and newer rejects everything other than v2. Core firmware keeps accepting v1.
export type DefinitionsVersion = 1 | 2;

const TREZOR_ONE_DEFINITIONS_V2_MIN_FIRMWARE = '1.14.2';

const DEFINITIONS_BASE_URLS: Record<DefinitionsVersion, string> = {
    1: 'https://data.trezor.io/firmware/eth-definitions',
    2: 'https://data.trezor.io/firmware/definitions/v2/eth',
};

export const getDefinitionsVersion = (firmwareVersion?: VersionArray): DefinitionsVersion =>
    firmwareVersion?.[0] === 1 &&
    isNewerOrEqual(firmwareVersion, TREZOR_ONE_DEFINITIONS_V2_MIN_FIRMWARE)
        ? 2
        : 1;

interface GetEthereumDefinitions {
    chainId?: number;
    slip44?: number;
    contractAddress?: string;
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
    version = 1,
}: GetEthereumDefinitions) => {
    const definitions: MessagesSchema.EthereumDefinitions = {};
    const baseUrl = DEFINITIONS_BASE_URLS[version];

    if (!chainId && !slip44) {
        throw new Error('argument chainId or slip44 is required');
    }

    try {
        const networkDefinitionUrl = `${baseUrl}/${
            chainId ? 'chain-id' : 'slip44'
        }/${chainId ?? slip44}/network.dat`;
        const networkDefinition = await fetch(networkDefinitionUrl);
        if (networkDefinition.status === 200) {
            definitions.encoded_network = await networkDefinition.arrayBuffer();
        } else if (networkDefinition.status !== 404) {
            throw new Error(`unexpected status: $${networkDefinition.status}`);
        }
    } catch (err) {
        console.warn(`unable to download or parse ${chainId} definition. detail: ${err.message}`);
    }

    try {
        if (contractAddress) {
            // Contract address has to be in lowercase in order to be found in eth-definitions.
            const lowerCaseContractAddress = contractAddress.toLowerCase();
            const tokenDefinitionUrl = `${baseUrl}/${
                chainId ? 'chain-id' : 'slip44'
            }/${chainId ?? slip44}/token-${lowerCaseContractAddress}.dat`;
            const tokenDefinition = await fetch(tokenDefinitionUrl);
            if (tokenDefinition.status === 200) {
                definitions.encoded_token = await tokenDefinition.arrayBuffer();
            } else if (tokenDefinition.status !== 404) {
                throw new Error(`unexpected status: $${tokenDefinition.status}`);
            }
        }
    } catch (err) {
        console.warn(
            `unable to download or parse ${chainId}/${contractAddress} definition. detail: ${err.message}`,
        );
    }

    return definitions;
};

interface GetDefinitionsForFirmware extends Omit<GetEthereumDefinitions, 'version'> {
    firmwareVersion?: VersionArray;
    definitions?: MessagesSchema.EthereumDefinitions;
}

/**
 * Definitions are downloaded before the device is known, in the v1 format which is enough to
 * decode their content. Returns the definitions in the format accepted by the device firmware.
 */
export const getDefinitionsForFirmware = ({
    firmwareVersion,
    definitions,
    ...request
}: GetDefinitionsForFirmware) => {
    const version = getDefinitionsVersion(firmwareVersion);

    if (!definitions || version === 1) {
        return Promise.resolve(definitions);
    }

    return getEthereumDefinitions({ ...request, version });
};

/**
 * decoded content of data retrieved from https://data.trezor.io/firmware/eth-definitions/...
 */
export type EthereumNetworkDefinitionDecoded = Static<typeof EthereumNetworkDefinitionDecoded>;
export const EthereumNetworkDefinitionDecoded = Type.Object({
    chain_id: Type.Number(),
    name: Type.String(),
    slip44: Type.Number(),
    symbol: Type.String(),
});

/**
 * decoded content of data retreived from https://data.trezor.io/firmware/eth-definitions/...
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

    const messages = DataManager.getProtobufMessages();
    const proto = parseConfigure(messages);

    (['encoded_token', 'encoded_network'] as const).forEach(key => {
        const encodedPayload = encodedDefinition[key];

        if (!encodedPayload) {
            // this should never happen as long as types are safe
            return;
        }

        const { definitionType, protobufPayload } = trzd.decode(encodedPayload);
        const { message: decodedDefinition } = decodeMessage(
            proto,
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
        connect: true,
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
