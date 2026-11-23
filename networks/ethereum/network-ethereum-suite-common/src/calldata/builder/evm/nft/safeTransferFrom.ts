import {
    createBuilder,
    createParam,
    createPolicy,
    validateBytes,
    validateUint256,
} from '@trezor/calldata';
import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../../constants/evm';
import { createEvmEncoder } from '../../../encoder/evm';
import { type EvmAddress } from '../../../types/evm';
import { validateAddress } from '../../../validation/evm/address';

type SafeTransferFromContext = {
    sender: EvmAddress;
};

const fromParam = createParam<string, EvmAddress, SafeTransferFromContext>({
    validate: validateAddress,
    policy: createPolicy({ NOT_SAME_AS_SENDER: 'error' }),
});

const toParam = createParam<string, EvmAddress, SafeTransferFromContext>({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'error', SELF_ADDRESS: 'warning' }),
});

// Token id 0 is a valid id, so no zero-amount policy here.
const tokenIdParam = createParam<BigNumber, bigint, SafeTransferFromContext>({
    validate: validateUint256,
});

const amountParam = createParam<BigNumber, bigint, SafeTransferFromContext>({
    validate: validateUint256,
    policy: createPolicy({ ZERO_AMOUNT: 'error' }),
});

const dataParam = createParam<string, `0x${string}`, SafeTransferFromContext>({
    validate: validateBytes,
});

export const buildErc721SafeTransferFrom = createBuilder({
    params: {
        from: fromParam,
        to: toParam,
        tokenId: tokenIdParam,
    },
    encode: createEvmEncoder(EVM_ABI.erc721.safeTransferFrom),
});

export const buildErc1155SafeTransferFrom = createBuilder({
    params: {
        from: fromParam,
        to: toParam,
        id: tokenIdParam,
        amount: amountParam,
        data: dataParam,
    },
    encode: createEvmEncoder(EVM_ABI.erc1155.safeTransferFrom),
});
