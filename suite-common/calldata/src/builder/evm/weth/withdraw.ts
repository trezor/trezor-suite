import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { createPolicy } from '../../../policy/createPolicy';
import { validateUint256 } from '../../../validation/shared/uint256';
import { createBuilder } from '../../createBuilder';
import { createParam } from '../../createParam';

type WethWithdrawContext = { balance?: bigint };

const wadParam = createParam<BigNumber, bigint, WethWithdrawContext>({
    validate: validateUint256,
    policy: createPolicy({ ZERO_AMOUNT: 'error' }),
});

export const buildWethWithdraw = createBuilder({
    params: {
        wad: wadParam,
    },
    encode: createEvmEncoder(EVM_ABI.weth.withdraw),
});
