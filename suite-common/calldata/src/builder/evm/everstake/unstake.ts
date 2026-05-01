import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { createPolicy } from '../../../policy/createPolicy';
import { validateUint16 } from '../../../validation/shared/uint16';
import { validateUint256 } from '../../../validation/shared/uint256';
import { validateUint64 } from '../../../validation/shared/uint64';
import { createBuilder } from '../../createBuilder';
import { createParam } from '../../createParam';

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
