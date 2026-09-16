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
}: MapGetAccountInfoResponseParams): Responses.GetAccountInfo => {
    // Tokens and transactions both count: an address that only ever received an ERC-20 has no
    // balance and no nonce, and reporting it as empty would cut account discovery short.
    const empty = balance === 0n && nonce === 0 && historyTotal <= 0 && !tokens?.length;
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
            },
            page,
        },
    };
};
