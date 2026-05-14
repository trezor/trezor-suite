import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../constants/evm';
import { createEvmEncoder } from '../../encoder/evm';
import { createPolicy } from '../../policy/createPolicy';
import { type ExtractOutputs } from '../../types/builder';
import { type EvmAddress } from '../../types/evm';
import { createArrayValidator } from '../../validation/createArrayValidator';
import { validateAddress } from '../../validation/evm/address';
import { validateBytes32 } from '../../validation/shared/bytes32';
import { validateUint256 } from '../../validation/shared/uint256';
import { createBuilder } from '../createBuilder';
import { createCrossValidator } from '../createCrossValidator';
import { createParam } from '../createParam';

type ClaimContext = {
    sender: EvmAddress;
};

const claimParams = {
    users: createParam<string[], EvmAddress[], ClaimContext>({
        validate: createArrayValidator(validateAddress),
        policy: createPolicy({ ZERO_ADDRESS: 'error', NOT_SAME_AS_SENDER: 'error' }),
    }),
    tokens: createParam<string[], EvmAddress[], ClaimContext>({
        validate: createArrayValidator(validateAddress),
        policy: createPolicy({ ZERO_ADDRESS: 'error' }),
    }),
    amounts: createParam<BigNumber[], bigint[], ClaimContext>({
        validate: createArrayValidator(validateUint256),
    }),
    proofs: createParam<string[][], `0x${string}`[][], ClaimContext>({
        validate: createArrayValidator(createArrayValidator(validateBytes32)),
    }),
};

type ClaimValues = ExtractOutputs<keyof typeof claimParams & string, typeof claimParams>;

const validateArrayLengths = createCrossValidator({
    validate: ({ users, tokens, amounts, proofs }: ClaimValues) => {
        const { length } = users;

        if ([tokens.length, amounts.length, proofs.length].some(len => len !== length)) {
            return 'ARRAYS_LENGTH_MISMATCH';
        }

        return null;
    },
});

export const buildClaim = createBuilder({
    params: claimParams,
    encode: createEvmEncoder(EVM_ABI.distributor.claim),
    crossValidate: [validateArrayLengths],
});
