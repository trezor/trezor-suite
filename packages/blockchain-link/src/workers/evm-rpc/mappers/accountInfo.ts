import type { TokenInfo } from '@trezor/blockchain-link-types';
import type { StakingPool } from '@trezor/blockchain-link-types/src/blockbook-api';
import { RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import type * as Responses from '@trezor/blockchain-link-types/src/responses';

interface MapGetAccountInfoResponseParams {
    descriptor: string;
    balance: bigint;
    nonce: number;
    pendingNonce: number;
    tokens?: TokenInfo[];
    stakingPools?: StakingPool[];
}

export const mapGetAccountInfoResponse = ({
    descriptor,
    balance,
    nonce,
    pendingNonce,
    tokens,
    stakingPools,
}: MapGetAccountInfoResponseParams): Responses.GetAccountInfo => {
    const empty = balance === 0n && nonce === 0;
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
                total: -1,
                unconfirmed,
            },
            misc: {
                nonce: nonce.toString(),
                stakingPools: stakingPools && stakingPools.length > 0 ? stakingPools : undefined,
            },
        },
    };
};
