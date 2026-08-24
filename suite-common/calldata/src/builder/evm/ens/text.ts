import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { validateBytes32 } from '../../../validation/shared/bytes32';
import { validateText } from '../../../validation/shared/text';
import { createBuilder } from '../../createBuilder';
import { createParam } from '../../createParam';

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
