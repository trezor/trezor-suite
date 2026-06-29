import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../constants/evm';
import { createEvmEncoder } from '../../encoder/evm';
import { createPolicy } from '../../policy/createPolicy';
import { type EvmAddress } from '../../types/evm';
import { validateAddress } from '../../validation/evm/address';
import { validateUint256 } from '../../validation/shared/uint256';
import { createBuilder } from '../createBuilder';
import { createParam } from '../createParam';

type Erc721SafeTransferFromContext = {
    sender: EvmAddress;
};

const fromParam = createParam<string, EvmAddress, Erc721SafeTransferFromContext>({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'error', NOT_SAME_AS_SENDER: 'error' }),
});

const toParam = createParam<string, EvmAddress, Erc721SafeTransferFromContext>({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'warning', SELF_ADDRESS: 'warning' }),
});

const tokenIdParam = createParam<BigNumber, bigint, Erc721SafeTransferFromContext>({
    validate: validateUint256,
    policy: createPolicy({ ZERO_AMOUNT: 'error' }),
});

export const buildErc721SafeTransferFrom = createBuilder({
    params: {
        from: fromParam,
        to: toParam,
        tokenId: tokenIdParam,
    },
    encode: createEvmEncoder(EVM_ABI.erc721.safeTransferFrom),
});
