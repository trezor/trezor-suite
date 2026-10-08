import { useMemo } from 'react';

import { selectIsQueryChainDataEnabled } from '@suite/flags';
import {
    toChainAccountRef,
    useChainAccountNonce,
    useSelectedChainNetworks,
} from '@suite-common/chain-data';
import { useEvmNonceInfo } from '@suite-common/wallet-core';
import type { AccountWithNetworkType, WalletAccountTransaction } from '@suite-common/wallet-types';
import { type EvmNonceInfo, getOwnEvmNonceSets } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

const NO_TRANSACTIONS: readonly WalletAccountTransaction[] = [];

export type UseAccountEvmNonceInfoOptions = {
    /** Skips reading until the caller needs the nonce. */
    enabled?: boolean;

    /**
     * Whether to read the nonce from the wallet store where the network does not resolve it. A
     * transaction list leaves that to each of its transactions.
     */
    withStoreFallback?: boolean;

    /**
     * The account's history the caller shows. A pending transaction reads as superseded only when
     * a mined transaction of the account at its nonce is listed there; callers that show no
     * history (the send form, account details) need no such reading.
     */
    transactions?: readonly (WalletAccountTransaction | null | undefined)[];
};

export type AccountEvmNonceInfo = {
    nonceInfo: EvmNonceInfo | undefined;
    isLoading: boolean;

    /** The nonce is resolved by the account's chain network rather than the wallet store. */
    isQueryOwned: boolean;
};

/**
 * Where an EVM account's nonce stands. With the `queryChainData` flag on and the account's network
 * resolving nonces, it is read through the network; otherwise as the wallet always did.
 */
export const useAccountEvmNonceInfo = (
    account: AccountWithNetworkType<'ethereum'> | undefined,
    {
        enabled = true,
        withStoreFallback = true,
        transactions = NO_TRANSACTIONS,
    }: UseAccountEvmNonceInfoOptions = {},
): AccountEvmNonceInfo => {
    const isQueryChainDataEnabled = useSelector(selectIsQueryChainDataEnabled);
    const networks = useSelectedChainNetworks();
    const network = account ? networks.find(({ symbol }) => symbol === account.symbol) : undefined;
    const isQueryOwned = isQueryChainDataEnabled && !!network?.getAccountNonce;

    const ref = useMemo(() => (account ? toChainAccountRef(account) : null), [account]);
    const chainNonce = useChainAccountNonce({ network, ref, enabled: enabled && isQueryOwned });
    const storeNonce = useEvmNonceInfo(withStoreFallback ? account : undefined, {
        enabled: enabled && !isQueryOwned,
    });

    const confirmedNonces = useMemo(
        () =>
            isQueryOwned
                ? getOwnEvmNonceSets(
                      transactions.filter((tx): tx is WalletAccountTransaction => !!tx),
                  ).confirmedNonces
                : undefined,
        [isQueryOwned, transactions],
    );

    const { data, isLoading } = chainNonce;

    return useMemo(() => {
        if (!isQueryOwned) return { ...storeNonce, isQueryOwned };

        return {
            nonceInfo:
                enabled && data && confirmedNonces
                    ? {
                          confirmedNonce: data.confirmedNonce,
                          nextNonce: data.nextNonce,
                          pendingNonces: [...data.pendingNonces],
                          confirmedNonces: [...confirmedNonces],
                      }
                    : undefined,
            isLoading: enabled && isLoading,
            isQueryOwned,
        };
    }, [isQueryOwned, storeNonce, enabled, data, isLoading, confirmedNonces]);
};
