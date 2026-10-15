import { createBuilder, createParam, validateBytes32 } from '@trezor/calldata';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';

const nodeParam = createParam({ validate: validateBytes32 });

/** The `addr` resolver profile, keyed by namehash. */
export const buildEnsAddr = createBuilder({
    params: { node: nodeParam },
    encode: createEvmEncoder(EVM_ABI.ens.addr),
});
