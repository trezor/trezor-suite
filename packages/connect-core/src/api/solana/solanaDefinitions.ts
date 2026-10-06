import fetch from 'cross-fetch';

import { MessagesSchema, protobufManager } from '@trezor/protobuf';
import { trzd } from '@trezor/protocol';
import { Assert } from '@trezor/schema-utils';

import type { DefinitionsVersion } from '../../utils/definitionsUtils';
import { getProductionDefinitionsUrl } from '../../utils/definitionsUtils';

interface GetSolanaTokenDefinition {
    mintAddress?: string;
    // Definitions sent to the device must match its format version.
    version?: DefinitionsVersion;
}

export const getSolanaTokenDefinition = async ({
    mintAddress,
    version = 1,
}: GetSolanaTokenDefinition) => {
    try {
        if (mintAddress) {
            const tokenDefinitionUrl = `${getProductionDefinitionsUrl(version)}/solana/token/${mintAddress}.dat`;
            const tokenDefinition = await fetch(tokenDefinitionUrl);

            if (tokenDefinition.status === 200) {
                const arrayBuffer = await tokenDefinition.arrayBuffer();

                return arrayBuffer;
            } else if (tokenDefinition.status !== 404) {
                throw new Error(`unexpected status: ${tokenDefinition.status}`);
            }
        }
    } catch (err) {
        console.warn(
            `unable to download or parse solana token ${mintAddress} definition. detail: ${err.message}`,
        );
    }

    return undefined;
};

export const decodeSolanaTokenDefinition = (
    encodedDefinition: ArrayBuffer,
): MessagesSchema.SolanaTokenInfo => {
    const { protobufPayload } = trzd.decode(encodedDefinition);
    const { message: decodedTokenDefinition } = protobufManager.decode(
        'SolanaTokenInfo',
        protobufPayload,
    );

    Assert(MessagesSchema.SolanaTokenInfo, decodedTokenDefinition);

    return decodedTokenDefinition;
};
