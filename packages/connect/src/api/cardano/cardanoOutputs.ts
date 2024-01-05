// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoOutputs.js

// allow for...of statements
/* eslint-disable no-restricted-syntax */

import { addressParametersToProto, validateAddressParameters } from './cardanoAddressParameters';
import { tokenBundleToProto, AssetGroupWithTokens } from './cardanoTokenBundle';
import { PROTO } from '../../constants';
import { hexStringByteLength, sendChunkedHexString } from './cardanoUtils';
import { CardanoAssetGroup, CardanoAddressParameters } from '../../types/api/cardano';
import { Assert, Type } from '@trezor/schema-utils';

export type OutputWithData = {
    output: PROTO.CardanoTxOutput;
    tokenBundle?: AssetGroupWithTokens[];
    inlineDatum?: string;
    referenceScript?: string;
};

export const OutputValidation = Type.Object({
    address: Type.Optional(Type.String()),
    amount: Type.Uint(),
    tokenBundle: Type.Optional(Type.Array(CardanoAssetGroup)),
    datumHash: Type.Optional(Type.String()),
    format: Type.Optional(Type.Number()),
    inlineDatum: Type.Optional(Type.String()),
    referenceScript: Type.Optional(Type.String()),
    addressParameters: Type.Optional(CardanoAddressParameters),
});

export const transformOutput = (output: unknown): OutputWithData => {
    Assert(OutputValidation, output);

    const result: OutputWithData = {
        output: {
            amount: output.amount,
            asset_groups_count: 0,
            datum_hash: output.datumHash,
            format: output.format,
            inline_datum_size: output.inlineDatum
                ? hexStringByteLength(output.inlineDatum)
                : undefined,
            reference_script_size: output.referenceScript
                ? hexStringByteLength(output.referenceScript)
                : undefined,
        },
        inlineDatum: output.inlineDatum,
        referenceScript: output.referenceScript,
    };

    if (output.addressParameters) {
        validateAddressParameters(output.addressParameters);
        result.output.address_parameters = addressParametersToProto(output.addressParameters);
    } else {
        result.output.address = output.address;
    }

    if (output.tokenBundle) {
        result.tokenBundle = tokenBundleToProto(output.tokenBundle);
        result.output.asset_groups_count = result.tokenBundle.length;
    } else {
        result.output.asset_groups_count = 0;
    }

    return result;
};

export const sendOutput = async (typedCall: any, outputWithData: OutputWithData) => {
    const MAX_CHUNK_SIZE = 1024 * 2; // 1024 hex-encoded bytes

    const { output, tokenBundle, inlineDatum, referenceScript } = outputWithData;

    await typedCall('CardanoTxOutput', 'CardanoTxItemAck', output);
    if (tokenBundle) {
        for (const assetGroup of tokenBundle) {
            await typedCall('CardanoAssetGroup', 'CardanoTxItemAck', {
                policy_id: assetGroup.policyId,
                tokens_count: assetGroup.tokens.length,
            });
            for (const token of assetGroup.tokens) {
                await typedCall('CardanoToken', 'CardanoTxItemAck', token);
            }
        }
    }

    if (inlineDatum) {
        await sendChunkedHexString(
            typedCall,
            inlineDatum,
            MAX_CHUNK_SIZE,
            'CardanoTxInlineDatumChunk',
        );
    }

    if (referenceScript) {
        await sendChunkedHexString(
            typedCall,
            referenceScript,
            MAX_CHUNK_SIZE,
            'CardanoTxReferenceScriptChunk',
        );
    }
};
