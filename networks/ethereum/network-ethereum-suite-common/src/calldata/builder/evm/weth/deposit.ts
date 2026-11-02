import { createBuilder } from '@trezor/calldata';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';

// deposit() takes no calldata arguments — the wrapped amount rides in the transaction value.
export const buildWethDeposit = createBuilder({
    params: {},
    encode: createEvmEncoder(EVM_ABI.weth.deposit),
});
