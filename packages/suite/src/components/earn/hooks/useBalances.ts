import { useQuery } from '@suite-common/react-query';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import { selectEnabledNetworks, selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { BalancesQueryDto, YieldDto, getAggregateBalances } from '@suite-common/earn-api';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

/**
 * This is just PoC
 */
export function useBalances(vaults: YieldDto[] = []) {
    const enabledNetworkSymbols = useSelector(selectEnabledNetworks);
    const accounts = useSelector(selectVisibleDeviceAccounts);

    return useQuery({
        queryKey: ['balances', vaults],
        queryFn: async () => {
            const enabledNetworks = new Set(enabledNetworkSymbols);
            const relevantAccountsWithTokens = accounts.filter(
                account => enabledNetworks.has(account.symbol) && account.tokens?.length,
            );

            // Compose for each vault a query with all relevant tokens
            const queries = vaults
                .map(vault => {
                    const network = getNetworkByYieldXyzId(vault.network);

                    return {
                        network,
                        vault,
                    };
                })
                // Network doesn't support Yield.xyz or network is not enabled
                .filter(item => item.network && enabledNetworks.has(item.network.symbol))
                .map(({ network, vault }) => {
                    const networkTokens = relevantAccountsWithTokens
                        .filter(
                            account => account.symbol === network!.symbol && account.tokens?.length,
                        )
                        .map(account => ({
                            account: account.key,
                            tokens:
                                account.tokens?.filter(
                                    token =>
                                        token.symbol === vault.token.symbol &&
                                        new BigNumber(token.balance ?? 0).gt(0) &&
                                        token.standard === 'ERC20',
                                ) ?? [],
                        }))
                        .filter(matches => matches.tokens.length > 0);

                    return networkTokens.map(({ tokens }) =>
                        tokens.map(
                            token =>
                                ({
                                    yieldId: vault.id,
                                    address: token.contract,
                                    network: vault.network,
                                }) satisfies BalancesQueryDto,
                        ),
                    );
                })
                .flat(3);

            console.log({ queries });

            // it handles over 600 queries without any issue
            const response = await getAggregateBalances({
                queries,
            });

            console.log(response.data);

            return response.data;
        },
        staleTime: 1000 * 60 * 5,
        enabled: vaults.length > 0,
    });
}
