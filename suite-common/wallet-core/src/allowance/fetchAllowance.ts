import { isAddress } from 'viem';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import { asAmountSubunit } from '@suite-common/wallet-utils';
import { EVM_ABI } from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

import { createEvmRead } from '../evm/evmRead';

type FetchAllowanceParams = {
    owner: string;
    spender: string;
    tokenContractAddress: string;
    coin: NetworkSymbol;
};

export const fetchAllowance = async ({
    owner,
    spender,
    tokenContractAddress,
    coin,
}: FetchAllowanceParams) => {
    if (!isAddress(tokenContractAddress, { strict: false })) {
        throw new Error('Allowance token contract address is invalid.');
    }

    const read = createEvmRead({ symbol: coin, from: owner });
    const allowance = await read.one({
        to: tokenContractAddress,
        abi: EVM_ABI.erc20.allowance,
        functionName: 'allowance',
        args: [owner, spender],
    });

    if (!allowance.success) {
        throw new Error(`Allowance read failed: ${allowance.errorName}`);
    }

    return asAmountSubunit(new BigNumber(allowance.value.toString()));
};
