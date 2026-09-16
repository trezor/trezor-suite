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
import { mapGetAccountInfoResponse } from '../mappers/accountInfo';
import { getStakingPoolData } from '../staking/poolData';
import { getKnownTokens, getTokenInfo, getTokenInfos } from '../tokens';
import type { Request } from '../types';
import { toHex } from '../utils/hex';

const wantsTransactions = (details: MessageTypes.GetAccountInfo['payload']['details']) =>
    details === 'txids' || details === 'txs';

const getTokens = async (
    request: Request<MessageTypes.GetAccountInfo>,
    address: `0x${string}`,
    history: DescriptorHistory,
): Promise<TokenInfo[] | undefined> => {
    const { payload } = request;
    const client = await request.connect();

    if (payload.details === 'tokenBalances' && payload.contractFilter) {
        const tokenInfo = await getTokenInfo(client, address, toHex(payload.contractFilter), true);

        return [tokenInfo].filter(isNotNull);
    }

    // Reading a few balances is one batched call, while finding tokens by log scan is the most
    // expensive thing this backend does — so the known list answers "what does this account hold"
    // and anything the account has actually transferred is kept alongside it, so a token stays
    // listed after being spent to zero the way a blockbook-backed account behaves.
    const discovered = [...history.tokenContracts];
    const known = (await getKnownTokens(client)).filter(
        contract => !discovered.includes(contract.toLowerCase()),
    );

    if (!discovered.length && !known.length) {
        return undefined;
    }

    const tokens = await getTokenInfos(client, address, [...discovered.map(toHex), ...known]);
    const discoveredCount = discovered.length;

    // A known token nobody holds is noise; one the account has touched is not.
    return tokens.filter((token, index) => index < discoveredCount || token.balance !== '0');
};

export const getAccountInfo = async (
    request: Request<MessageTypes.GetAccountInfo>,
): Promise<Responses.GetAccountInfo> => {
    const { payload, state } = request;
    const client = await request.connect();

    const address = toHex(payload.descriptor);

    // Account discovery asks for transactions too, for every candidate address it walks, and then
    // keeps none of them. Only an account Suite has actually taken on is subscribed, so that is the
    // one worth reading history for; discovery settles for balances, which is all `empty` needs.
    const isWatched = !!state.getAccount(payload.descriptor);
    const includeTransactions = wantsTransactions(payload.details) && isWatched;

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
        getTokens(request, address, history),
    ]);

    return mapGetAccountInfoResponse({
        descriptor: payload.descriptor,
        balance,
        nonce,
        pendingNonce,
        tokens,
        stakingPools,
        // -1 keeps its established "unknown" meaning until the first scan, which is what prompts
        // Suite to ask for transactions and prime the cache; from then on it is a real count, and a
        // change in it is the only signal that an incoming token transfer has landed.
        historyTotal: page?.total ?? (isCold(history) ? -1 : history.entries.size),
        txids: page?.txids,
        transactions: page?.transactions,
        page: page?.page,
    });
};
