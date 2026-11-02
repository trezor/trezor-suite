import { createBuilder, createParam, createPolicy, validateUint256 } from '@trezor/calldata';
import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../constants/evm';
import { createEvmEncoder } from '../../encoder/evm';
import { type EvmAddress } from '../../types/evm';
import { validateAddress } from '../../validation/evm/address';

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
