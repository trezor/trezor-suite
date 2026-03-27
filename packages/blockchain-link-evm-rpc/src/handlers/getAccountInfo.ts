import type { TokenInfo } from '@trezor/blockchain-link-types';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import type * as Responses from '@trezor/blockchain-link-types/src/responses';

import { mapGetAccountInfoResponse } from '../mappers/accountInfo';
import { getStakingPoolData } from '../staking/poolData';
import { getTokenInfo } from '../tokens/tokenInfo';
import type { Request } from '../types';
import { toHex } from '../utils/hex';

export const getAccountInfo = async (
    request: Request<MessageTypes.GetAccountInfo>,
): Promise<Responses.GetAccountInfo> => {
    const { payload } = request;
    const client = await request.connect();

    const address = toHex(payload.descriptor);

    const [balance, nonce, pendingNonce, stakingPools] = await Promise.all([
        client.getBalance({ address }),
        client.getTransactionCount({ address }),
        client.getTransactionCount({ address, blockTag: 'pending' }),
        getStakingPoolData(client, address),
    ]);

    let tokens: TokenInfo[] | undefined;
    if (payload.details === 'tokenBalances' && payload.contractFilter) {
        const contractAddress = toHex(payload.contractFilter);
        const tokenInfo = await getTokenInfo(client, address, contractAddress, true);
        tokens = [tokenInfo].filter((token): token is TokenInfo => token !== null);
    }

    return mapGetAccountInfoResponse({
        descriptor: payload.descriptor,
        balance,
        nonce,
        pendingNonce,
        tokens,
        stakingPools,
    });
};
