import type { PublicClient } from 'viem';

import type {
    MessageTypes,
    ResponseTypes as Responses,
    TokenInfo,
} from '@trezor/blockchain-link-types';
import { isNotNull } from '@trezor/utils';

import {
    type DescriptorHistory,
    getDescriptorHistory,
    getHistoryPage,
    isCold,
    syncHistory,
} from '../history';
import { HISTORY_STEP_BLOCKS } from '../history/constants';
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

const wantsTransactions = (details: AccountInfoDetails) => details === 'txids' || details === 'txs';

const getTokens = async (
    request: Request<MessageTypes.GetAccountInfo>,
    client: PublicClient,
    address: `0x${string}`,
    history: DescriptorHistory,
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
        scanned: history.tokenContracts,
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
    const { payload, state } = request;
    const client = await request.connect();

    const address = toHex(payload.descriptor);

    const includeTransactions = wantsTransactions(payload.details);

    const [balance, nonce, pendingNonce, stakingPools] = await Promise.all([
        client.getBalance({ address }),
        client.getTransactionCount({ address }),
        client.getTransactionCount({ address, blockTag: 'pending' }),
        getStakingPoolData(client, address),
    ]);

    // Balances alone answer what the account holds and whether it is empty, so a request that only
    // wants those costs no log scan at all — which is what account discovery asks for.
    const history = includeTransactions
        ? await syncHistory({
              client,
              state,
              descriptor: payload.descriptor,
              fromBlock: payload.from,
          })
        : getDescriptorHistory(state, payload.descriptor);

    const [page, tokens] = await Promise.all([
        includeTransactions
            ? getHistoryPage({
                  client,
                  history,
                  descriptor: payload.descriptor,
                  page: payload.page,
                  pageSize: payload.pageSize,
                  includeTransactions: payload.details === 'txs',
              })
            : undefined,
        getTokens(request, client, address, history),
    ]);

    // Only meaningful once something has been scanned, and only while the window has a floor left
    // to move: at block 0 the account's whole history is already covered.
    const olderHistoryFrom =
        !isCold(history) && history.syncedFrom > 0
            ? Math.max(0, history.syncedFrom - HISTORY_STEP_BLOCKS)
            : undefined;

    return mapGetAccountInfoResponse({
        descriptor: payload.descriptor,
        balance,
        nonce,
        pendingNonce,
        tokens,
        stakingPools,
        // Entries the live watcher ingested count even on a request that did not scan, so a cheap
        // refresh still reports an incoming transfer. -1 keeps its "unknown" meaning only while
        // nothing has ever been seen, which is what prompts Suite to ask for transactions.
        historyTotal: page?.total ?? (history.entries.size || (isCold(history) ? -1 : 0)),
        txids: page?.txids,
        transactions: page?.transactions,
        page: page?.page,
        olderHistoryFrom,
    });
};
