import { useCallback, useMemo, useState } from 'react';

import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import {
    YieldDto,
    YieldsControllerGetYields200,
    getAggregateBalances,
    useGetYieldOpportunities,
} from '@suite-common/earn-api';
import { Column, Row } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useDiscovery } from 'src/hooks/suite';

import { EnterYieldOpportunity } from './EnterYieldOpportunity';
import { useBalances } from './hooks/useBalances';

interface Pagination {
    pageSize: number;
    totalCount: number | null;
}

function usePagination({ pageSize, totalCount }: Pagination) {
    const [pagination, setPagination] = useState({
        offset: 0,
        limit: pageSize,
    });

    const goToPreviousPage = useCallback(() => {
        setPagination({
            offset: Math.max(0, pagination.offset - pageSize),
            limit: pageSize,
        });
    }, [pagination.offset, pageSize, setPagination]);

    const goToNextPage = useCallback(() => {
        if (totalCount === null) return;

        setPagination({
            offset: Math.min(pagination.offset + pageSize, totalCount - pageSize),
            limit: pageSize,
        });
    }, [pagination.offset, pageSize, totalCount, setPagination]);

    return {
        pagination,
        goToPreviousPage,
        goToNextPage,
        pageSize,
    };
}

function hasEnoughCapacity(vault: YieldDto) {
    const MIN_ALLOWED_CAPACITY = 1000; // 1000 USD (this is just an example!)
    const remaining = vault.state?.capacityState?.remaining;

    if (!remaining) return false;

    return new BigNumber(remaining).gte(MIN_ALLOWED_CAPACITY);
}

export function StablecoinYields() {
    const { isDiscoveryRunning } = useDiscovery();
    const [totalItemsCount, setTotalItemsCount] = useState<number | null>(null);
    const { pagination } = usePagination({
        pageSize: 20,
        totalCount: totalItemsCount,
    });

    const getYieldOpportunities = useGetYieldOpportunities({
        onSuccess: data => {
            setTotalItemsCount(data.data.total);
        },
    });

    const yieldOpportunitiesQuery = useQuery({
        queryKey: desktopQueryKeys.yieldOpportunities(pagination),
        queryFn: () => getYieldOpportunities.mutateAsync(pagination),
        // data are cached for 5 minutes
        staleTime: 1000 * 60 * 5,
    });

    useBalances(yieldOpportunitiesQuery.data?.data.items);

    if (yieldOpportunitiesQuery.isLoading) {
        return <div>Loading...</div>;
    }

    if (yieldOpportunitiesQuery.isError) {
        return <div>Error: {yieldOpportunitiesQuery.error.message}</div>;
    }

    const vaults = yieldOpportunitiesQuery.data?.data as YieldsControllerGetYields200;

    return (
        <section>
            <h3>Stablecoin Yields</h3>
            <p>Available yield opportunities:</p>
            <Column gap={16}>
                {vaults.items
                    ?.filter(
                        vault =>
                            !vault.metadata.underMaintenance &&
                            !vault.metadata.deprecated &&
                            getNetworkByYieldXyzId(vault.network),
                    )
                    .map(vault => (
                        <Row key={vault.id} gap={16}>
                            {vault.network}
                            <img
                                src={vault.metadata.logoURI}
                                alt={vault.metadata.name}
                                width={32}
                                height={32}
                            />
                            <div>{vault.token.symbol}</div>
                            <div>{Math.round(vault.rewardRate.total * 10000) / 100}%</div>
                            <div>{vault.metadata.name}</div>
                            <EnterYieldOpportunity
                                yieldId={vault.id}
                                token={vault.token}
                                isDisabled={
                                    !vault.status.enter ||
                                    isDiscoveryRunning ||
                                    !hasEnoughCapacity(vault)
                                }
                                network={getNetworkByYieldXyzId(vault.network)!}
                            />
                        </Row>
                    ))}
            </Column>
        </section>
    );
}
