import { RESPONSES } from '@trezor/blockchain-link-types';
import type {
    ResponseTypes as Responses,
    StakingPool,
    TokenInfo,
} from '@trezor/blockchain-link-types';

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
    // A token counts too: an address that only ever received an ERC-20 has no balance and no nonce,
    // and calling it empty would hide the token it holds.
    const empty = balance === 0n && nonce === 0 && !tokens?.length;
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
