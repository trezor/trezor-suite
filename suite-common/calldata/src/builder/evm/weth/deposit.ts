import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { createBuilder } from '../../createBuilder';

// The wrapped amount is carried in the transaction value, not in calldata.
export const buildWethDeposit = createBuilder({
    params: {},
    encode: createEvmEncoder(EVM_ABI.weth.deposit),
});
