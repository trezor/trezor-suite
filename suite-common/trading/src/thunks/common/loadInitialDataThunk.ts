import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type SelectedAccountStatus } from '@suite-common/wallet-types';

import {
    TRADE_API_RELOAD_DATA_AFTER_MS,
    TRADING_FALLBACK_API_KEY,
    TRADING_THUNK_PREFIX,
} from '../../constants';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingSellActions } from '../../reducers/sellReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    type TradingRootStateWithAccounts,
    selectTradingAccountAccordingActiveSection,
    selectTradingBuyInfo,
    selectTradingExchangeInfo,
    selectTradingInfo,
    selectTradingLoadingAndTimestamp,
    selectTradingSellInfo,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import { type TradeServerEnvironment, type TradingType } from '../../types';
import { loadBuyInfoThunk } from '../buy/loadBuyInfoThunk';
import { loadExchangeInfoThunk } from '../exchange/loadExchangeInfoThunk';
import { loadSellInfoThunk } from '../sell/loadSellInfoThunk';

export interface LoadInitialDataThunkProps {
    activeSection: TradingType;
    forcedApiKey?: string;
    forceReload?: boolean;
}

type LoadInitialDataThunkState = TradingRootStateWithAccounts;

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
    async ({ activeSection, forcedApiKey, forceReload = false }, { dispatch, getState, extra }) => {
        const selectedAccount = extra.services.getSelectedAccount();
        const account = selectTradingAccountAccordingActiveSection(
            getState(),
            activeSection,
            selectedAccount,
        );
        const buyInfo = selectTradingBuyInfo(getState());
        const exchangeInfo = selectTradingExchangeInfo(getState());
        const sellInfo = selectTradingSellInfo(getState());
        const { isLoading, lastLoadedTimestamp } = selectTradingLoadingAndTimestamp(getState());
        const { platforms, coins } = selectTradingInfo(getState());

        dispatch(tradingActions.setTradingActiveSection(activeSection));

        const apiKey = account?.descriptor || forcedApiKey || TRADING_FALLBACK_API_KEY;
        tradeApi.createApiKey(apiKey);

        const tradeServerEnvironment = extra.services.getTradingEnvironment();
        if (tradeServerEnvironment) {
            tradeApi.setServersEnvironment(tradeServerEnvironment);
        }

        const areDataOutdated =
            lastLoadedTimestamp === 0 ||
            Date.now() - lastLoadedTimestamp >= TRADE_API_RELOAD_DATA_AFTER_MS;
        const shouldReloadAll = forceReload || areDataOutdated;
        const isInfoMissing = !platforms || !coins;
        const isAnythingMissing = isInfoMissing || !buyInfo || !exchangeInfo || !sellInfo;

        if (isLoading || (!shouldReloadAll && !isAnythingMissing)) {
            return;
        }

        const serverUrl = tradeApi.getApiServerUrl();
        let updatedTimestamp = lastLoadedTimestamp;
        dispatch(tradingActions.setLoading({ isLoading: true, lastLoadedTimestamp }));

        try {
            if (shouldReloadAll) {
                const [info, buyInfoData, exchangeInfoData, sellInfoData] = await Promise.all([
                    tradeApi.getInfo(),
                    dispatch(loadBuyInfoThunk()).unwrap(),
                    dispatch(loadExchangeInfoThunk()).unwrap(),
                    dispatch(loadSellInfoThunk()).unwrap(),
                ]);

                if (info) {
                    dispatch(tradingActions.saveInfo(info));
                }
                dispatch(tradingBuyActions.saveBuyInfo(buyInfoData));
                dispatch(tradingExchangeActions.saveExchangeInfo(exchangeInfoData));
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

            if (!exchangeInfo) {
                const exchangeInfoData = await dispatch(loadExchangeInfoThunk()).unwrap();

                dispatch(tradingExchangeActions.saveExchangeInfo(exchangeInfoData));
            }

            if (!sellInfo) {
                const sellInfoData = await dispatch(loadSellInfoThunk()).unwrap();

                dispatch(tradingSellActions.saveSellInfo(sellInfoData));
            }
        } finally {
            const currentTimestamp =
                selectTradingLoadingAndTimestamp(getState()).lastLoadedTimestamp;
            const wasInvalidated =
                currentTimestamp !== lastLoadedTimestamp ||
                tradeApi.getApiServerUrl() !== serverUrl;

            dispatch(
                tradingActions.setLoading({
                    isLoading: false,
                    lastLoadedTimestamp: wasInvalidated ? 0 : updatedTimestamp,
                }),
            );
        }
    },
);
