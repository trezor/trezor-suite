import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { createArrayValidator } from '../../../validation/createArrayValidator';
import { validateBytes } from '../../../validation/shared/bytes';
import { createBuilder } from '../../createBuilder';
import { createParam } from '../../createParam';

const dataParam = createParam({ validate: createArrayValidator(validateBytes) });

/** A resolver's own `multicall`, batching several profile calls into one `resolve`. */
export const buildEnsMulticall = createBuilder({
    params: { data: dataParam },
    encode: createEvmEncoder(EVM_ABI.ens.multicall),
});
