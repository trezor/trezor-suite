// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoInputs.js

import { validateParams } from '../common/paramsValidator';
import { validatePath } from '../../utils/pathUtils';
import type { PROTO } from '../../constants';

export type Path = number[];

export type InputWithPath = {
    input: PROTO.CardanoTxInput;
    path?: Path;
};

export type CollateralInputWithPath = {
    collateralInput: PROTO.CardanoTxCollateralInput;
    path?: Path;
};

export const transformInput = (input: any): InputWithPath => {
    validateParams(input, [
        { name: 'prev_hash', type: 'string', required: true },
        { name: 'prev_index', type: 'number', required: true },
    ]);
    return {
        input: {
            prev_hash: input.prev_hash,
            prev_index: input.prev_index,
        },
        path: input.path ? validatePath(input.path, 5) : undefined,
    };
};

export const transformCollateralInput = (collateralInput: any): CollateralInputWithPath => {
    validateParams(collateralInput, [
        { name: 'prev_hash', type: 'string', required: true },
        { name: 'prev_index', type: 'number', required: true },
    ]);
    return {
        collateralInput: {
            prev_hash: collateralInput.prev_hash,
            prev_index: collateralInput.prev_index,
        },
        path: collateralInput.path ? validatePath(collateralInput.path, 5) : undefined,
    };
};
