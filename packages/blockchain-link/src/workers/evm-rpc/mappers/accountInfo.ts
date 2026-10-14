import { RESPONSES } from '@trezor/blockchain-link-types';
import type {
    AccountInfo,
    ResponseTypes as Responses,
    StakingPool,
    TokenInfo,
    Transaction,
} from '@trezor/blockchain-link-types';

interface MapGetAccountInfoResponseParams {
    descriptor: string;
    balance: bigint;
    nonce: number;
    pendingNonce: number;
    tokens?: TokenInfo[];
    stakingPools?: StakingPool[];
    /** Number of known transactions, or -1 while the backend has not looked yet. */
    historyTotal: number;
    txids?: string[];
    transactions?: Transaction[];
    page?: AccountInfo['page'];
    /** Block to ask for next to reach further back, when anything older is reachable. */
    olderHistoryFrom?: number;
    /** Unix time of the oldest block the scanned history covers. */
    historyCoveredSince?: number;
    /** A known token holds a balance, checked when `tokens` was not asked for. */
    holdsKnownToken?: boolean;
}

export const mapGetAccountInfoResponse = ({
    descriptor,
    balance,
    nonce,
    pendingNonce,
    tokens,
    stakingPools,
    historyTotal,
    txids,
    transactions,
    page,
    olderHistoryFrom,
    historyCoveredSince,
    holdsKnownToken = false,
}: MapGetAccountInfoResponseParams): Responses.GetAccountInfo => {
    // Tokens and transactions both count: an address that only ever received an ERC-20 has no
    // balance and no nonce, and reporting it as empty would cut account discovery short. A token
    // listed at zero is no sign of use, since known tokens are listed for every account.
    const holdsTokens = holdsKnownToken || !!tokens?.some(token => token.balance !== '0');
    const empty = balance === 0n && nonce === 0 && historyTotal <= 0 && !holdsTokens;
    const unconfirmed = pendingNonce - nonce;
    const balanceString = balance.toString();

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: {
            descriptor,
            balance: balanceString,
            availableBalance: balanceString,
            empty,
            tokens: tokens && tokens.length > 0 ? tokens : undefined,
            history: {
                total: historyTotal,
                unconfirmed,
                txids,
                transactions,
            },
            misc: {
                nonce: nonce.toString(),
                stakingPools: stakingPools && stakingPools.length > 0 ? stakingPools : undefined,
                olderHistoryFrom,
                historyCoveredSince,
            },
            page,
        },
    };
};
