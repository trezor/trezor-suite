import { useCallback } from 'react';

import { type CryptoId } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import { getCryptoId, parseCryptoId } from '@suite-common/trading';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { useCurrentRef } from '@trezor/react-utils';

import { useSelector } from 'src/hooks/suite';

export interface UseTradingFindAccountOrTokenProps {
    accountKey: string;
    cryptoId: CryptoId;
}

/**
 * Based on `accountKey` and `cryptoId` find corresponding account or its token
 */
export function useTradingFindAccountOrToken() {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const findAccountOrToken = useCallback(
        ({ accountKey, cryptoId }: UseTradingFindAccountOrTokenProps) => {
            const account = accounts.find(account => account.key === accountKey);

            if (!account) {
                return null;
            }

            const { contractAddress } = parseCryptoId(cryptoId);

            if (getCryptoId(networkConfigDeps, account.symbol) === cryptoId || !contractAddress) {
                return { account, token: null };
            }

            const contractAddressForNetworkSymbol = getContractAddressForNetworkSymbol(
                networkConfigDeps,
                account.symbol,
                contractAddress,
            );
            const token =
                account.tokens?.find(
                    token =>
                        getContractAddressForNetworkSymbol(
                            networkConfigDeps,
                            account.symbol,
                            token.contract,
                        ) === contractAddressForNetworkSymbol,
                ) ?? null;

            return { account, token };
        },
        [accounts],
    );

    /**
     * - Accounts get re-rendered very often, therefore any descendant useMemo/useCallback hook would be invalidated that many times too.
     * - So use ref to avoid it.
     */
    const findAccountOrTokenRef = useCurrentRef(findAccountOrToken);

    return findAccountOrTokenRef;
}
