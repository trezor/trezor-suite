import { type SelectedAccountStatus } from '@suite-common/wallet-types';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { type SetTradeApiKeyThunkState, setTradeApiKeyThunk } from './setTradeApiKeyThunk';
import {
    TRADE_API_RELOAD_DATA_AFTER_MS,
    TRADING_ANONYMOUS_ID,
    TRADING_THUNK_PREFIX,
} from '../../constants';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingSellActions } from '../../reducers/sellReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    type TradingRootStateWithAccounts,
    selectTradeApiKeyAccount,
    selectTradingBuyInfo,
    selectTradingExchangeCatalogLoadingAndTimestamp,
    selectTradingExchangeInfo,
    selectTradingInfo,
    selectTradingSellInfo,
    selectTradingSharedCatalogLoadingAndTimestamp,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import { type TradeServerEnvironment, type TradingType } from '../../types';
import { loadBuyInfoThunk } from '../buy/loadBuyInfoThunk';
import { loadExchangeInfoThunk } from '../exchange/loadExchangeInfoThunk';
import { loadSellInfoThunk } from '../sell/loadSellInfoThunk';

export interface LoadInitialDataThunkProps {
    activeSection: TradingType;
    /**
     * The section whose catalog the caller reads, when it differs from `activeSection`.
     * The coin info and the buy and sell catalogs always load.
     * The swap catalog is several megabytes, so it loads only for `exchange`.
     */
    catalogSection?: TradingType;
    forcedAnonymousId?: string;
    forceReload?: boolean;
}

export type LoadInitialDataThunkState = TradingRootStateWithAccounts & SetTradeApiKeyThunkState;

export type LoadInitialDataThunkDeps = WithServices<{
    getSelectedAccount: () => SelectedAccountStatus;
    getTradingEnvironment: GetTradingEnvironment;
}>;

export type GetTradingEnvironment = () => TradeServerEnvironment | undefined;

export const loadInitialDataThunk = createThunk<
    void,
    LoadInitialDataThunkProps,
    { state: LoadInitialDataThunkState; extra: LoadInitialDataThunkDeps }
>(
    `${TRADING_THUNK_PREFIX}/loadInitialData`,
    async (
        { activeSection, catalogSection = activeSection, forcedAnonymousId, forceReload = false },
        { dispatch, getState, extra },
    ) => {
        const account = selectTradeApiKeyAccount(
            getState(),
            activeSection,
            extra.services.getSelectedAccount(),
        );
        const buyInfo = selectTradingBuyInfo(getState());
        const sellInfo = selectTradingSellInfo(getState());
        const { isLoading, lastLoadedTimestamp } =
            selectTradingSharedCatalogLoadingAndTimestamp(getState());
        const { platforms, coins } = selectTradingInfo(getState());

        dispatch(tradingActions.setTradingActiveSection(activeSection));

        if (account || activeSection === 'buy') {
            dispatch(setTradeApiKeyThunk({ account }));
        } else {
            tradeApi.createAnonymousApiKey(forcedAnonymousId || TRADING_ANONYMOUS_ID);
        }

        const tradeServerEnvironment = extra.services.getTradingEnvironment();
        if (tradeServerEnvironment) {
            tradeApi.setServersEnvironment(tradeServerEnvironment);
        }

        const serverUrl = tradeApi.getApiServerUrl();
        const isOutdated = (timestamp: number) =>
            forceReload ||
            timestamp === 0 ||
            Date.now() - timestamp >= TRADE_API_RELOAD_DATA_AFTER_MS;
        // A load that raced a debug server switch must not be kept as fresh.
        const isStaleLoad = (startTimestamp: number, currentTimestamp: number) =>
            currentTimestamp !== startTimestamp || tradeApi.getApiServerUrl() !== serverUrl;

        const loadExchangeCatalog = async () => {
            const exchangeCatalog = selectTradingExchangeCatalogLoadingAndTimestamp(getState());
            const isExchangeInfoMissing = !selectTradingExchangeInfo(getState());

            if (
                exchangeCatalog.isLoading ||
                (!isExchangeInfoMissing && !isOutdated(exchangeCatalog.lastLoadedTimestamp))
            ) {
                return;
            }

            let updatedTimestamp = exchangeCatalog.lastLoadedTimestamp;
            dispatch(
                tradingExchangeActions.setExchangeInfoLoading({
                    isLoading: true,
                    lastLoadedTimestamp: exchangeCatalog.lastLoadedTimestamp,
                }),
            );

            try {
                const exchangeInfoData = await dispatch(loadExchangeInfoThunk()).unwrap();

                dispatch(tradingExchangeActions.saveExchangeInfo(exchangeInfoData));
                updatedTimestamp = Date.now();
            } finally {
                const { lastLoadedTimestamp: currentTimestamp } =
                    selectTradingExchangeCatalogLoadingAndTimestamp(getState());

                dispatch(
                    tradingExchangeActions.setExchangeInfoLoading({
                        isLoading: false,
                        lastLoadedTimestamp: isStaleLoad(
                            exchangeCatalog.lastLoadedTimestamp,
                            currentTimestamp,
                        )
                            ? 0
                            : updatedTimestamp,
                    }),
                );
            }
        };

        const loadSharedCatalog = async () => {
            const shouldReloadAll = isOutdated(lastLoadedTimestamp);
            const isInfoMissing = !platforms || !coins;
            const isAnythingMissing = isInfoMissing || !buyInfo || !sellInfo;

            if (isLoading || (!shouldReloadAll && !isAnythingMissing)) {
                return;
            }

            let updatedTimestamp = lastLoadedTimestamp;
            dispatch(tradingActions.setLoading({ isLoading: true, lastLoadedTimestamp }));

            try {
                if (shouldReloadAll) {
                    const [info, buyInfoData, sellInfoData] = await Promise.all([
                        tradeApi.getInfo(),
                        dispatch(loadBuyInfoThunk()).unwrap(),
                        dispatch(loadSellInfoThunk()).unwrap(),
                    ]);

                    if (info) {
                        dispatch(tradingActions.saveInfo(info));
                    }
                    dispatch(tradingBuyActions.saveBuyInfo(buyInfoData));
                    dispatch(tradingSellActions.saveSellInfo(sellInfoData));
                    updatedTimestamp = Date.now();

                    return;
                }

                if (isInfoMissing) {
                    const info = await tradeApi.getInfo();

                    // Skip saveInfo on failure so we never replace an existing catalog with empty data.
                    if (info) {
                        dispatch(tradingActions.saveInfo(info));
                    }
                }

                if (!buyInfo) {
                    const buyInfoData = await dispatch(loadBuyInfoThunk()).unwrap();
                    dispatch(tradingBuyActions.saveBuyInfo(buyInfoData));
                }

                if (!sellInfo) {
                    const sellInfoData = await dispatch(loadSellInfoThunk()).unwrap();

                    dispatch(tradingSellActions.saveSellInfo(sellInfoData));
                }
            } finally {
                const { lastLoadedTimestamp: currentTimestamp } =
                    selectTradingSharedCatalogLoadingAndTimestamp(getState());

                dispatch(
                    tradingActions.setLoading({
                        isLoading: false,
                        lastLoadedTimestamp: isStaleLoad(lastLoadedTimestamp, currentTimestamp)
                            ? 0
                            : updatedTimestamp,
                    }),
                );
            }
        };

        await Promise.all([
            loadSharedCatalog(),
            catalogSection === 'exchange' ? loadExchangeCatalog() : undefined,
        ]);
    },
);
