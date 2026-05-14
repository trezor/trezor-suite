import { type YieldDto, getYields } from '@suite-common/earn-stablecoin-api';
import { desktopQueryKeys, useQuery } from '@suite-common/react-query';

const STALE_TIME = 1000 * 60 * 5;
const YIELD_OPPORTUNITIES_PAGE_SIZE = 20;

const getAllYieldOpportunities = async ({ limit }: { limit: number }) => {
    let offset = 0;
    let totalItems = Number.POSITIVE_INFINITY;
    let fetchedItemsCount = 0;
    const allItems: YieldDto[] = [];

    while (fetchedItemsCount < totalItems) {
        const response = await getYields({
            params: {
                offset,
                limit,
                providers: ['morpho'],
                types: ['vault'],
                sort: 'statusEnterDesc',
            },
        });
        const { items, total, limit: responseLimit, offset: responseOffset } = response;

        if (items.length === 0) {
            break;
        }

        allItems.push(...items);
        fetchedItemsCount += items.length;
        totalItems = total;
        offset = responseOffset + responseLimit;
    }

    return allItems;
};

const isYieldOpportunityAvailable = (vault: YieldDto) =>
    !vault.metadata.underMaintenance && !vault.metadata.deprecated;

export const useAllYieldOpportunities = ({ enabled = true }: { enabled?: boolean } = {}) => {
    const yieldOpportunitiesQuery = useQuery({
        queryKey: desktopQueryKeys.yieldOpportunities({
            limit: YIELD_OPPORTUNITIES_PAGE_SIZE,
        }),
        async queryFn() {
            const yieldOpportunities = await getAllYieldOpportunities({
                limit: YIELD_OPPORTUNITIES_PAGE_SIZE,
            });

            return yieldOpportunities.filter(isYieldOpportunityAvailable);
        },
        enabled,
        staleTime: STALE_TIME,
    });

    return {
        yieldOpportunities: yieldOpportunitiesQuery.data ?? [],
        isYieldOpportunitiesLoading: yieldOpportunitiesQuery.isLoading,
    };
};
