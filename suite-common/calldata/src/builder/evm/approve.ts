import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../constants/evm';
import { createEvmEncoder } from '../../encoder/evm';
import { createPolicy } from '../../policy/createPolicy';
import { type EvmAddress } from '../../types/evm';
import { validateAddress } from '../../validation/evm/address';
import { validateUint256 } from '../../validation/evm/uint256';
import { createBuilder } from '../createBuilder';
import { createParam } from '../createParam';

type ApproveContext = {
    sender: EvmAddress;
};

const spenderParam = createParam<string, EvmAddress, ApproveContext>({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'warning', SELF_ADDRESS: 'warning' }),
});

const amountParam = createParam<BigNumber, bigint, ApproveContext>({
    validate: validateUint256,
});

export const buildApprove = createBuilder({
    params: {
        spender: spenderParam,
        amount: amountParam,
    },
    encode: createEvmEncoder(EVM_ABI.erc20.approve),
});
