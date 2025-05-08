import fetch from 'cross-fetch';

import { MessagesSchema, decodeMessage, parseConfigure } from '@trezor/protobuf';
import { trzd } from '@trezor/protocol';
import { Assert } from '@trezor/schema-utils';

import { DataManager } from '../../data/DataManager';

interface GetSolanaTokenDefinition {
    mintAddress?: string;
}

export const getSolanaTokenDefinition = async ({ mintAddress }: GetSolanaTokenDefinition) => {
    try {
        if (mintAddress) {
            const tokenDefinitionUrl = `https://data.trezor.io/firmware/definitions/solana/token/${mintAddress}.dat`;
            const tokenDefinition = await fetch(tokenDefinitionUrl);

            if (tokenDefinition.status === 200) {
                const arrayBuffer = await tokenDefinition.arrayBuffer();

                return arrayBuffer;
            } else if (tokenDefinition.status !== 404) {
                throw new Error(`unexpected status: $${tokenDefinition.status}`);
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
    const messages = DataManager.getProtobufMessages();
    const proto = parseConfigure(messages);

    const { protobufPayload } = trzd.decode(encodedDefinition);
    const { message: decodedTokenDefinition } = decodeMessage(
        proto,
        'SolanaTokenInfo',
        protobufPayload,
    );

    Assert(MessagesSchema.SolanaTokenInfo, decodedTokenDefinition);

    return decodedTokenDefinition;
};
