import type { PublicClient } from 'viem';

import type {
    MessageTypes,
    ResponseTypes as Responses,
    TokenInfo,
} from '@trezor/blockchain-link-types';
import { isNotNull } from '@trezor/utils';

import { mapGetAccountInfoResponse } from '../mappers/accountInfo';
import { getStakingPoolData } from '../staking/poolData';
import { getTokenCandidates, trackTokenContract } from '../tokens/candidates';
import { getTokenInfo, getTokenInfos } from '../tokens/tokenInfo';
import type { Request } from '../types';
import { toHex } from '../utils/hex';

type AccountInfoDetails = MessageTypes.GetAccountInfo['payload']['details'];

// Account discovery asks for `basic` and settles for balance and nonce; anything deeper is Suite
// asking what an account it has already taken on holds.
const wantsTokens = (details: AccountInfoDetails) =>
    details === 'tokens' || details === 'tokenBalances' || details === 'txids' || details === 'txs';

const getTokens = async (
    request: Request<MessageTypes.GetAccountInfo>,
    client: PublicClient,
    address: `0x${string}`,
): Promise<TokenInfo[] | undefined> => {
    const { payload, state } = request;

    if (!wantsTokens(payload.details)) {
        return undefined;
    }

    if (payload.details === 'tokenBalances' && payload.contractFilter) {
        // Suite asks this way for tokens the user added by hand, so the account keeps reporting
        // them on its own from now on.
        trackTokenContract(state, payload.descriptor, payload.contractFilter);
        const tokenInfo = await getTokenInfo(client, address, toHex(payload.contractFilter), true);

        return [tokenInfo].filter(isNotNull);
    }

    const { tracked, known } = await getTokenCandidates({
        client,
        state,
        descriptor: payload.descriptor,
    });

    if (!tracked.length && !known.length) {
        return undefined;
    }

    const tokens = await getTokenInfos(client, address, [...tracked, ...known]);

    // A known token nobody holds is noise; one the account has touched is not.
    return tokens.filter((token, index) => index < tracked.length || token.balance !== '0');
};

export const getAccountInfo = async (
    request: Request<MessageTypes.GetAccountInfo>,
): Promise<Responses.GetAccountInfo> => {
    const { payload } = request;
    const client = await request.connect();

    const address = toHex(payload.descriptor);

    const [balance, nonce, pendingNonce, stakingPools, tokens] = await Promise.all([
        client.getBalance({ address }),
        client.getTransactionCount({ address }),
        client.getTransactionCount({ address, blockTag: 'pending' }),
        getStakingPoolData(client, address),
        getTokens(request, client, address),
    ]);

    return mapGetAccountInfoResponse({
        descriptor: payload.descriptor,
        balance,
        nonce,
        pendingNonce,
        tokens,
        stakingPools,
    });
};
