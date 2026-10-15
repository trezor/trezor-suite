import { createArrayValidator, createBuilder, createParam, validateBytes } from '@trezor/calldata';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';

const dataParam = createParam({ validate: createArrayValidator(validateBytes) });

/** A resolver's own `multicall`, batching several profile calls into one `resolve`. */
export const buildEnsMulticall = createBuilder({
    params: { data: dataParam },
    encode: createEvmEncoder(EVM_ABI.ens.multicall),
});
