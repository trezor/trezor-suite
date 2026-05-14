import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../constants/evm';
import { createEvmEncoder } from '../../encoder/evm';
import { createPolicy } from '../../policy/createPolicy';
import { type EvmAddress } from '../../types/evm';
import { validateAddress } from '../../validation/evm/address';
import { validateUint256 } from '../../validation/shared/uint256';
import { createBuilder } from '../createBuilder';
import { createParam } from '../createParam';

type RedeemContext = {
    sender: EvmAddress;
    balance?: bigint;
};

const sharesParam = createParam<BigNumber, bigint, RedeemContext>({
    validate: validateUint256,
    policy: createPolicy({ ZERO_AMOUNT: 'error' }),
});

const receiverParam = createParam<string, EvmAddress, RedeemContext>({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'error', NOT_SAME_AS_SENDER: 'error' }),
});

const ownerParam = createParam<string, EvmAddress, RedeemContext>({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'error', NOT_SAME_AS_SENDER: 'error' }),
});

export const buildRedeem = createBuilder({
    params: {
        shares: sharesParam,
        receiver: receiverParam,
        owner: ownerParam,
    },
    encode: createEvmEncoder(EVM_ABI.erc4626.redeem),
});
