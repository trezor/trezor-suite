import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { validateUint64 } from '../../../validation/shared/uint64';
import { createBuilder } from '../../createBuilder';
import { createParam } from '../../createParam';

const sourceParam = createParam({
    validate: validateUint64,
});

export const buildStake = createBuilder({
    params: {
        source: sourceParam,
    },
    encode: createEvmEncoder(EVM_ABI.everstake.stake),
});
