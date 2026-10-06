import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { validateBytes } from '../../../validation/shared/bytes';
import { validateUint256 } from '../../../validation/shared/uint256';
import { createBuilder } from '../../createBuilder';
import { createParam } from '../../createParam';

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
