import { createBuilder, createParam, validateBytes32, validateText } from '@trezor/calldata';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';

const nodeParam = createParam({ validate: validateBytes32 });
const keyParam = createParam({ validate: validateText });

/** The `text` resolver profile, keyed by namehash and record key. */
export const buildEnsText = createBuilder({
    params: {
        node: nodeParam,
        key: keyParam,
    },
    encode: createEvmEncoder(EVM_ABI.ens.text),
});
