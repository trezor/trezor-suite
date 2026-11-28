import {
    type ExtractOutputs,
    createArrayValidator,
    createBuilder,
    createCrossValidator,
    createParam,
    createPolicy,
    validateUint256,
} from '@trezor/calldata';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';

// Request ids and checkpoint indexes both start at one.
const claimWithdrawalsParams = {
    requestIds: createParam({
        validate: createArrayValidator(validateUint256),
        policy: createPolicy({ ZERO_AMOUNT: 'error' }),
    }),
    hints: createParam({
        validate: createArrayValidator(validateUint256),
        policy: createPolicy({ ZERO_AMOUNT: 'error' }),
    }),
};

type ClaimWithdrawalsValues = ExtractOutputs<
    keyof typeof claimWithdrawalsParams & string,
    typeof claimWithdrawalsParams
>;

const validateArrayLengths = createCrossValidator({
    validate: ({ requestIds, hints }: ClaimWithdrawalsValues) =>
        requestIds.length === hints.length ? null : 'ARRAYS_LENGTH_MISMATCH',
});

export const buildLidoClaimWithdrawals = createBuilder({
    params: claimWithdrawalsParams,
    encode: createEvmEncoder(EVM_ABI.lido.claimWithdrawals),
    crossValidate: [validateArrayLengths],
});
