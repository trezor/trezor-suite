import { EVM_ABI } from '../../constants/evm';
import { createEvmEncoder } from '../../encoder/evm';
import { createPolicy } from '../../policy/createPolicy';
import { validateAddress } from '../../validation/evm/address';
import { createBuilder } from '../createBuilder';
import { createParam } from '../createParam';

const ownerParam = createParam({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'error' }),
});

const spenderParam = createParam({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'error' }),
});

export const buildAllowance = createBuilder({
    params: {
        owner: ownerParam,
        spender: spenderParam,
    },
    encode: createEvmEncoder(EVM_ABI.erc20.allowance),
});
