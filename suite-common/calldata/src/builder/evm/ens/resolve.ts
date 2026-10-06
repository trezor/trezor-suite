import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { validateBytes } from '../../../validation/shared/bytes';
import { createBuilder } from '../../createBuilder';
import { createParam } from '../../createParam';

const nameParam = createParam({ validate: validateBytes });
const dataParam = createParam({ validate: validateBytes });

/** `UniversalResolver.resolve`: a DNS-encoded name plus the resolver profile call to run on it. */
export const buildEnsResolve = createBuilder({
    params: {
        name: nameParam,
        data: dataParam,
    },
    encode: createEvmEncoder(EVM_ABI.ens.resolve),
});
