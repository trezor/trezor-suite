import { createBuilder, createParam, validateBytes } from '@trezor/calldata';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';

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
