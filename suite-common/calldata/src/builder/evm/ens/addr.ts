import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { validateBytes32 } from '../../../validation/shared/bytes32';
import { createBuilder } from '../../createBuilder';
import { createParam } from '../../createParam';

const nodeParam = createParam({ validate: validateBytes32 });

/** The `addr` resolver profile, keyed by namehash. */
export const buildEnsAddr = createBuilder({
    params: { node: nodeParam },
    encode: createEvmEncoder(EVM_ABI.ens.addr),
});
