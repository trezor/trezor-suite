import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import {
    type AccountWithNetworkType,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    getEvmNonceInfo,
    getEvmNonceInfoFromConfirmedNonce,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

import { type AccountsRootState } from '../accounts/accountsReducer';
import type { TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectAccountTransactions } from '../transactions/transactionsSelectors';

const EMPTY_TRANSACTIONS: WalletAccountTransaction[] = [];

type UseEvmNonceInfoOptions = {
    // Skips the backend fetch until the caller actually needs it (e.g. the send-form nonce
    // override panel isn't open yet, or the account isn't an ethereum account at all).
    enabled?: boolean;
};

/**
 * Fetches an EVM account's confirmed (mined-only) nonce once (e.g. when the account details page,
 * a transaction row, or the send-form nonce override panel loads) and combines it with the local
 * pending-tx list to derive the next available nonce (see `getEvmNonceInfo`). This is a
 * point-in-time display value, not a live guarantee — the authoritative check that actually gates
 * signing happens again, independently, right before broadcasting (`resolveEthereumNonce`'s
 * `fetchConfirmedNonce` inside `signEthereumSendFormTransactionThunk`).
 *
 * `account` may be `undefined` (e.g. a non-ethereum account, or not yet resolved) — the query is
 * then disabled and this returns `{ nonceInfo: undefined, isLoading: false }`, so callers that
 * render for every network type (like `TransactionItem`) can call this unconditionally.
 */
export const useEvmNonceInfo = (
    account: AccountWithNetworkType<'ethereum'> | undefined,
    { enabled = true }: UseEvmNonceInfoOptions = {},
) => {
    const transactions = useSelector((state: TransactionsRootState & AccountsRootState) =>
        account ? selectAccountTransactions(state, account.key) : EMPTY_TRANSACTIONS,
    );
    const isEnabled = enabled && account !== undefined;

    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is symbol + descriptor + misc.nonce; tryGetAccountIdentity(account) only reads stable identity fields that don't widen the key
    const { data, isLoading } = useQuery({
        // account.misc.nonce is included so a delayed store update (e.g. fetchAndUpdateAccountThunk
        // dispatches the tx-list update, then updates account.misc.nonce only after an `await` a few
        // lines later — see accountsThunks.ts) invalidates the query instead of leaving it stuck on
        // whatever nonce happened to be current when this hook's very first fetch fired.
        queryKey: commonQueryKeys.evmConfirmedNonce(
            account?.symbol ?? '',
            account?.descriptor ?? '',
            account?.misc.nonce ?? '',
        ),
        queryFn: async () => {
            // Unreachable while disabled — `enabled` below is false whenever `account` is undefined.
            if (!account) throw new Error('useEvmNonceInfo: missing account');

            const response = await TrezorConnect.getAccountInfo({
                coin: asCoinSymbol(account.symbol),
                descriptor: account.descriptor,
                identity: tryGetAccountIdentity(account),
                details: 'basic',
                confirmedNonce: true,
                suppressBackupWarning: true,
            });

            if (!response.success) throw new Error(response.error.message);

            const confirmedNonce = response.payload.misc?.confirmedNonce;
            if (confirmedNonce != null) return { nonce: confirmedNonce, isTrusted: true as const };

            // Falls back to the account's last-synced (potentially pending-inclusive) nonce when
            // the backend doesn't return a mined-only count yet (trezor/blockbook#1562) — no worse
            // than the status quo, and starts working automatically once the backend ships it. This
            // value is untrusted, so it still needs getEvmNonceInfo's reconciliation below.
            return { nonce: account.misc.nonce, isTrusted: false as const };
        },
        enabled: isEnabled,
    });

    return useMemo(() => {
        if (!isEnabled || data === undefined) return { nonceInfo: undefined, isLoading: false };

        const nonceInfo = data.isTrusted
            ? getEvmNonceInfoFromConfirmedNonce(parseInt(data.nonce, 10), transactions)
            : getEvmNonceInfo(parseInt(data.nonce, 10), transactions);

        return { nonceInfo, isLoading };
    }, [isEnabled, data, transactions, isLoading]);
};
