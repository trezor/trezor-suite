import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { createBuilder } from '../../createBuilder';

export const buildClaimWithdrawRequest = createBuilder({
    params: {},
    encode: createEvmEncoder(EVM_ABI.everstake.claimWithdrawRequest),
});
