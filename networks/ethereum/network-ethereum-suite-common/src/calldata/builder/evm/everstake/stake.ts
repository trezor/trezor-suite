import { createBuilder, createParam, validateUint64 } from '@trezor/calldata';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';

const sourceParam = createParam({
    validate: validateUint64,
});

export const buildStake = createBuilder({
    params: {
        source: sourceParam,
    },
    encode: createEvmEncoder(EVM_ABI.everstake.stake),
});
