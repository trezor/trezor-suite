// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoOutputs.js

import { validateParams } from '../common/paramsValidator';
import { addressParametersToProto, validateAddressParameters } from './cardanoAddressParameters';
import { tokenBundleToProto } from './cardanoTokenBundle';
import type { AssetGroupWithTokens } from './cardanoTokenBundle';
import type { PROTO } from '../../constants';

export type OutputWithTokens = {
    output: PROTO.CardanoTxOutput;
    tokenBundle?: AssetGroupWithTokens[];
};

export const transformOutput = (output: any): OutputWithTokens => {
    validateParams(output, [
        { name: 'address', type: 'string' },
        { name: 'amount', type: 'uint', required: true },
        { name: 'tokenBundle', type: 'array', allowEmpty: true },
        { name: 'datumHash', type: 'string' },
    ]);

    const result: OutputWithTokens = {
        output: {
            amount: output.amount,
            asset_groups_count: 0,
            datum_hash: output.datumHash,
        },
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
