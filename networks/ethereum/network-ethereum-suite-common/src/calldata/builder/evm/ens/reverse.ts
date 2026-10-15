import { createBuilder, createParam, validateBytes, validateUint256 } from '@trezor/calldata';
import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';

const lookupAddressParam = createParam({ validate: validateBytes });
const coinTypeParam = createParam<BigNumber, bigint, Record<string, unknown>>({
    validate: validateUint256,
});

/** `UniversalResolver.reverse`: an address plus the ENSIP-19 coin type naming its namespace. */
export const buildEnsReverse = createBuilder({
    params: {
        lookupAddress: lookupAddressParam,
        coinType: coinTypeParam,
    },
    encode: createEvmEncoder(EVM_ABI.ens.reverse),
});
