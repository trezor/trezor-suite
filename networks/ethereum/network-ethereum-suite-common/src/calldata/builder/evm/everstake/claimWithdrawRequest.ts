import { createBuilder } from '@trezor/calldata';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';

export const buildClaimWithdrawRequest = createBuilder({
    params: {},
    encode: createEvmEncoder(EVM_ABI.everstake.claimWithdrawRequest),
});
