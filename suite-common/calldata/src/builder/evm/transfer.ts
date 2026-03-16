import { type AmountSubunit } from '@suite-common/wallet-utils';

import { EVM_ABI } from '../../constants/evm';
import { createEvmEncoder } from '../../encoder/evm';
import { createPolicy } from '../../policy/createPolicy';
import { type EvmAddress } from '../../types/evm';
import { validateAddress } from '../../validation/evm/address';
import { validateUint256 } from '../../validation/evm/uint256';
import { createBuilder } from '../createBuilder';
import { createParam } from '../createParam';

type TransferContext = {
    sender: EvmAddress;
    balance?: bigint;
};

const toParam = createParam<string, EvmAddress, TransferContext>({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'warning', SELF_ADDRESS: 'warning' }),
});

const amountParam = createParam<AmountSubunit, bigint, TransferContext>({
    validate: validateUint256,
});

export const buildTransfer = createBuilder({
    params: {
        to: toParam,
        amount: amountParam,
    },
    encode: createEvmEncoder(EVM_ABI.erc20.transfer),
});
