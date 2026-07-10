import {
    SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED,
    address,
    isSolanaError,
    parseBase64RpcAccount,
} from '@solana/kit';
import { decodeStakeStateAccount } from '@solana-program/stake';

import type { AccountInfoBase, AccountInfoWithBase64EncodedData, Lamports } from '../types';

export { address } from '@solana/kit';

export const isConnectionClosedError = (error: any) =>
    isSolanaError(error, SOLANA_ERROR__RPC_SUBSCRIPTIONS__CHANNEL_CONNECTION_CLOSED);

type StakeAccountInfo = {
    data: [string, 'base64'];
    executable: boolean;
    lamports: number;
    owner: string;
    rentEpoch: string;
    space: number;
};

type StakeAccountWithKey = {
    account: StakeAccountInfo;
    pubkey: string;
};

const toRpcAccount = (
    account: StakeAccountInfo,
): AccountInfoBase & { rentEpoch: bigint } & AccountInfoWithBase64EncodedData => ({
    data: account.data as AccountInfoWithBase64EncodedData['data'],
    executable: account.executable,
    lamports: BigInt(account.lamports) as Lamports,
    owner: address(account.owner),
    rentEpoch: BigInt(account.rentEpoch ?? 0),
    space: BigInt(account.space ?? 0),
});

export const decodeStakeResponses = (accountWithKey: StakeAccountWithKey) => {
    const parsed = parseBase64RpcAccount(
        address(accountWithKey.pubkey),
        toRpcAccount(accountWithKey.account),
    );
    const decoded = decodeStakeStateAccount(parsed);

    return {
        account: accountWithKey.pubkey,
        decoded: decoded.data,
    };
};
