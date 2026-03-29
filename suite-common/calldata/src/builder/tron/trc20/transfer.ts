import { type BigNumber } from '@trezor/utils';

import { TRON_ABI } from '../../../constants/tron';
import { createTronEncoder } from '../../../encoder/tron';
import { createPolicy } from '../../../policy/createPolicy';
import { type TronAddress } from '../../../types/tron';
import { validateUint256 } from '../../../validation/shared/uint256';
import { validateTronAddress } from '../../../validation/tron/address';
import { createBuilder } from '../../createBuilder';
import { createParam } from '../../createParam';

type TransferContext = {
    sender?: TronAddress;
};

const toParam = createParam<string, TronAddress, TransferContext>({
    validate: validateTronAddress,
    policy: createPolicy({ SELF_ADDRESS: 'warning' }),
});

const amountParam = createParam<BigNumber, bigint, TransferContext>({
    validate: validateUint256,
});

export const buildTrc20Transfer = createBuilder({
    params: {
        to: toParam,
        amount: amountParam,
    },
    encode: createTronEncoder(TRON_ABI.trc20.transfer),
});
