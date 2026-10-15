import { createBuilder, createParam, createPolicy, validateUint256 } from '@trezor/calldata';
import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';

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
