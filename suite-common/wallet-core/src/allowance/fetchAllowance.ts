import { Calldata } from '@suite-common/calldata';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { asAmountSubunit } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

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
    const allowanceCalldata = Calldata.evm.erc20.allowance({ owner, spender });

    if (!allowanceCalldata.data) {
        throw new Error('Allowance calldata could not be built.');
    }

    const response = await TrezorConnect.blockchainEvmRpcCall({
        coin,
        from: owner,
        to: tokenContractAddress,
        data: allowanceCalldata.data,
    });

    if (!response.success) {
        throw new Error(response.error.message);
    }

    return asAmountSubunit(new BigNumber(BigInt(response.payload.data).toString()));
};
