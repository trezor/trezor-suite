import { encodeFunctionData } from 'viem';

import { type BigNumber } from '@trezor/utils';

import { EVM_ABI } from '../../constants/evm';
import { createPolicy } from '../../policy/createPolicy';
import { type EvmAddress } from '../../types/evm';
import { type Encoder } from '../../types/encoder';
import { validateAddress } from '../../validation/evm/address';
import { validateUint256 } from '../../validation/shared/uint256';
import { createBuilder } from '../createBuilder';
import { createParam } from '../createParam';

type Erc1155SafeTransferFromContext = {
    sender: EvmAddress;
};

const fromParam = createParam<string, EvmAddress, Erc1155SafeTransferFromContext>({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'error', NOT_SAME_AS_SENDER: 'error' }),
});

const toParam = createParam<string, EvmAddress, Erc1155SafeTransferFromContext>({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'warning', SELF_ADDRESS: 'warning' }),
});

const idParam = createParam<BigNumber, bigint, Erc1155SafeTransferFromContext>({
    validate: validateUint256,
});

const amountParam = createParam<BigNumber, bigint, Erc1155SafeTransferFromContext>({
    validate: validateUint256,
    policy: createPolicy({ ZERO_AMOUNT: 'error' }),
});

// ERC1155 safeTransferFrom requires a `data` bytes argument — always empty for simple transfers.
const encodeErc1155SafeTransferFrom: Encoder<'from' | 'to' | 'id' | 'amount', `0x${string}`> =
    values =>
        encodeFunctionData({
            abi: EVM_ABI.erc1155.safeTransferFrom,
            functionName: 'safeTransferFrom',
            args: [
                values.from as EvmAddress,
                values.to as EvmAddress,
                values.id as bigint,
                values.amount as bigint,
                '0x',
            ],
        });

export const buildErc1155SafeTransferFrom = createBuilder({
    params: {
        from: fromParam,
        to: toParam,
        id: idParam,
        amount: amountParam,
    },
    encode: encodeErc1155SafeTransferFrom,
});
