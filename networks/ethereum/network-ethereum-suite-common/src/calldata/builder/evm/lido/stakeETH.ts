import { createBuilder, createParam, createPolicy } from '@trezor/calldata';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { validateAddress } from '../../../validation/evm/address';

// The staked amount rides in the transaction value. Lido reads the zero address as a stake
// without a referral.
const referralParam = createParam({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'ignore' }),
});

export const buildLidoStakeETH = createBuilder({
    params: {
        referral: referralParam,
    },
    encode: createEvmEncoder(EVM_ABI.lido.stakeETH),
});
