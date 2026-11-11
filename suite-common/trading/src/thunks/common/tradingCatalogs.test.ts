import { tradingQueryKeys } from '@suite-common/react-query';

import { getTradingCatalogStatus, subscribeToTradingCatalogs } from './tradingCatalogs';
import { mockTradingQueryClient } from '../../../mocks';
import { tradeApi } from '../../tradeApi';

const SERVER_URL = 'http://localhost:3330';

describe('subscribeToTradingCatalogs', () => {
    it('calls back only for the given events of catalog queries', () => {
        const queryClient = mockTradingQueryClient();
        const onCatalogChange = jest.fn();
        const unsubscribe = subscribeToTradingCatalogs(
            queryClient,
            new Set(['removed']),
            onCatalogChange,
        );

        queryClient.setQueryData(tradingQueryKeys.catalog(SERVER_URL, 'info'), null);
        queryClient.setQueryData(['other'], null);
        queryClient.removeQueries({ queryKey: ['other'] });
        queryClient.removeQueries({ queryKey: tradingQueryKeys.catalogs() });
        unsubscribe();

        expect(onCatalogChange).toHaveBeenCalledTimes(1);
    });
});

describe('getTradingCatalogStatus', () => {
    it('returns the same status object until a catalog changes', () => {
        const queryClient = mockTradingQueryClient();
        const initialStatus = getTradingCatalogStatus(queryClient, ['info']);

        queryClient.setQueryData(
            tradingQueryKeys.catalog(tradeApi.getApiServerUrl(), 'info'),
            null,
        );
        const loadedStatus = getTradingCatalogStatus(queryClient, ['info']);

        expect(getTradingCatalogStatus(queryClient, ['info'])).toBe(loadedStatus);
        expect(loadedStatus).not.toBe(initialStatus);
    });

    it('reports no load time for an empty catalog list', () => {
        expect(getTradingCatalogStatus(mockTradingQueryClient(), [])).toEqual({
            isLoading: false,
            lastLoadedTimestamp: 0,
        });
    });
});
