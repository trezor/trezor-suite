import {
    createBuilder,
    createParam,
    createPolicy,
    validateUint16,
    validateUint256,
    validateUint64,
} from '@trezor/calldata';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';

const valueParam = createParam({
    validate: validateUint256,
    policy: createPolicy({ ZERO_AMOUNT: 'error' }),
});

const allowedInterchangeNumParam = createParam({
    validate: validateUint16,
});

const sourceParam = createParam({
    validate: validateUint64,
});

export const buildUnstake = createBuilder({
    params: {
        value: valueParam,
        allowedInterchangeNum: allowedInterchangeNumParam,
        source: sourceParam,
    },
    encode: createEvmEncoder(EVM_ABI.everstake.unstake),
});
