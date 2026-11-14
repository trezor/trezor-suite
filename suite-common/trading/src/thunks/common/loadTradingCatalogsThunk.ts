import { type QueryClientDep } from '@suite-common/react-query';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { type TradingCatalog, loadTradingCatalog } from './tradingCatalogs';
import { TRADING_ANONYMOUS_ID, TRADING_THUNK_PREFIX } from '../../constants';
import { tradeApi } from '../../tradeApi';
import { type TradeServerEnvironment } from '../../types';

export type GetTradingEnvironment = () => TradeServerEnvironment | undefined;

export interface LoadTradingCatalogsThunkProps {
    catalogs: readonly TradingCatalog[];
    forceReload?: boolean;
}

export type LoadTradingCatalogsThunkDeps = WithServices<
    QueryClientDep & {
        getTradingEnvironment: GetTradingEnvironment;
    }
>;

/**
 * Loads catalogs without changing the active section or the API key of the section in use,
 * for screens that only show catalog data, such as a trade's detail.
 */
export const loadTradingCatalogsThunk = createThunk<
    void,
    LoadTradingCatalogsThunkProps,
    { extra: LoadTradingCatalogsThunkDeps }
>(
    `${TRADING_THUNK_PREFIX}/loadTradingCatalogs`,
    async ({ catalogs, forceReload = false }, { dispatch, extra }) => {
        const { queryClient, getTradingEnvironment } = extra.services;

        // A screen opened before any trading section still needs a key for the catalog requests.
        if (!tradeApi.getCurrentApiKey()) {
            tradeApi.createAnonymousApiKey(TRADING_ANONYMOUS_ID);
        }

        const tradeServerEnvironment = getTradingEnvironment();
        if (tradeServerEnvironment) {
            tradeApi.setServersEnvironment(tradeServerEnvironment);
        }

        await Promise.all(
            catalogs.map(catalog =>
                loadTradingCatalog(catalog, { dispatch, queryClient, forceReload }),
            ),
        );
    },
);
