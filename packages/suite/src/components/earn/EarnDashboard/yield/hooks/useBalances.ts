import { useMemo } from 'react';

import { type BalancesQueryDto, type YieldDto, getAggregateBalances } from '@suite-common/earn-api';
import { useQuery } from '@suite-common/react-query';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { getSuppliedBalancesByYieldAndAddress } from '../../utils/earnYieldUtils';

const STALE_TIME = 1000 * 60 * 5;

type UseBalancesProps = {
    vaults: YieldDto[];
    accounts: Account[];
};

export const useBalances = ({ vaults, accounts }: UseBalancesProps) => {
    const balanceQueries = useMemo<BalancesQueryDto[]>(() => {
        const queryMap = new Map<string, BalancesQueryDto>();

        vaults.forEach(vault => {
            const network = getNetworkByYieldXyzId(vault.network);

            if (!network) {
                return;
            }

            accounts
                .filter(account => account.symbol === network.symbol)
                .forEach(account => {
                    const query = {
                        yieldId: vault.id,
                        address: account.descriptor,
                        network: vault.network,
                    } satisfies BalancesQueryDto;

                    queryMap.set(`${query.yieldId}:${query.address}:${query.network}`, query);
                });
        });

        return Array.from(queryMap.values());
    }, [accounts, vaults]);

    const balancesQuery = useQuery({
        queryKey: ['yield-balances', balanceQueries],
        queryFn: async () => {
            const response = await getAggregateBalances({ queries: balanceQueries });

            return response.data.items;
        },
        staleTime: STALE_TIME,
        enabled: balanceQueries.length > 0,
    });

    const suppliedBalancesByYieldAndAddress = useMemo(
        () => getSuppliedBalancesByYieldAndAddress(balancesQuery.data ?? []),
        [balancesQuery.data],
    );

    return { suppliedBalancesByYieldAndAddress };
};
