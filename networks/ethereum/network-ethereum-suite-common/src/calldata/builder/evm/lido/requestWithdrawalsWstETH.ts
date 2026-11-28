import {
    createArrayValidator,
    createBuilder,
    createParam,
    createPolicy,
    validateUint256,
} from '@trezor/calldata';
import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { type EvmAddress } from '../../../types/evm';
import { validateAddress } from '../../../validation/evm/address';

type RequestWithdrawalsWstETHContext = {
    sender: EvmAddress;
};

const amountsParam = createParam<BigNumber[], bigint[], RequestWithdrawalsWstETHContext>({
    validate: createArrayValidator(validateUint256),
    policy: createPolicy({ ZERO_AMOUNT: 'error' }),
});

// The owner receives the withdrawal NFT, and with it the right to claim the ether.
const ownerParam = createParam<string, EvmAddress, RequestWithdrawalsWstETHContext>({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'error', NOT_SAME_AS_SENDER: 'error' }),
});

export const buildLidoRequestWithdrawalsWstETH = createBuilder({
    params: {
        amounts: amountsParam,
        owner: ownerParam,
    },
    encode: createEvmEncoder(EVM_ABI.lido.requestWithdrawalsWstETH),
});
