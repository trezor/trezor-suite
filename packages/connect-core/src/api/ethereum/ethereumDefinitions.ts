import fetch from 'cross-fetch';

import type {
    DefinitionsChannel,
    EthereumNetworkInfoDefinitionValues,
} from '@trezor/connect-common';
import type { MessagesSchema } from '@trezor/protobuf';
import { protobufManager } from '@trezor/protobuf';
import { trzd } from '@trezor/protocol';
import type { Static } from '@trezor/schema-utils';
import { Assert, Type } from '@trezor/schema-utils';

import { ethereumNetworkInfoBase } from '../../data/coinInfo';
import * as settingsStore from '../../data/settingsStore';

interface GetEthereumDefinitions {
    chainId?: number;
    slip44?: number;
    contractAddress?: string;
    functionSignature?: string;
}

const getDefinitionsBaseUrl = (channel: DefinitionsChannel = 'production') => {
    switch (channel) {
        case 'production':
            return 'https://data.trezor.io/firmware/definitions/eth';
        case 'development':
            return 'https://data.trezor.io/dev/firmware/dev-definitions/eth';
        case 'local':
            return 'http://localhost:3000';
        default:
            throw new Error(`Unknown channel: ${channel}`);
    }
};

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
}: GetEthereumDefinitions) => {
    const definitions: MessagesSchema.EthereumDefinitions = {};

    if (!chainId && !slip44) {
        throw new Error('argument chainId or slip44 is required');
    }

    // The channel is a global connect setting; fall back to `production` when settings are not
    // loaded (e.g. when this helper is exercised outside of a running connect core).
    const channel = settingsStore.isLoaded() ? settingsStore.get('definitionsChannel') : undefined;
    const baseUrl = getDefinitionsBaseUrl(channel);

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
