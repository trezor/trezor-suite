import { createBuilder, createParam, createPolicy, validateUint256 } from '@trezor/calldata';
import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../constants/evm';
import { createEvmEncoder } from '../../encoder/evm';
import { type EvmAddress } from '../../types/evm';
import { validateAddress } from '../../validation/evm/address';

type TransferContext = {
    sender: EvmAddress;
    balance?: bigint;
};

const toParam = createParam<string, EvmAddress, TransferContext>({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'warning', SELF_ADDRESS: 'warning' }),
});

const amountParam = createParam<BigNumber, bigint, TransferContext>({
    validate: validateUint256,
});

export const buildTransfer = createBuilder({
    params: {
        to: toParam,
        amount: amountParam,
    },
    encode: createEvmEncoder(EVM_ABI.erc20.transfer),
});
