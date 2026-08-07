import { createThunk } from '@suite-common/redux-utils';
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
}

type LoadInitialDataThunkState = TradingRootStateWithAccounts;
type LoadInitialDataThunkDeps = {
    services: {
        getSelectedAccount: () => SelectedAccountStatus;
        getTradingEnvironment: () => TradeServerEnvironment | undefined;
    };
};

export const loadInitialDataThunk = createThunk<
    void,
    LoadInitialDataThunkProps,
    { state: LoadInitialDataThunkState; extra: LoadInitialDataThunkDeps }
>(
    `${TRADING_THUNK_PREFIX}/loadInitialData`,
    async ({ activeSection, forcedApiKey }, { dispatch, getState, extra }) => {
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

        const currentAccountDescriptor = tradeApi.getCurrentAccountDescriptor();
        const isDifferentAccount = currentAccountDescriptor !== account?.descriptor;
        const areDataOutdated = lastLoadedTimestamp + TRADE_API_RELOAD_DATA_AFTER_MS < Date.now();

        dispatch(tradingActions.setTradingActiveSection(activeSection));

        if (!isLoading && (isDifferentAccount || areDataOutdated)) {
            dispatch(tradingActions.setLoading({ isLoading: true }));

            const tradeServerEnvironment = extra.services.getTradingEnvironment();
            if (tradeServerEnvironment) {
                tradeApi.setServersEnvironment(tradeServerEnvironment);
            }

            const apiKey = account?.descriptor || forcedApiKey || TRADING_FALLBACK_API_KEY;
            tradeApi.createApiKey(apiKey);

            if (isDifferentAccount || !platforms || !coins) {
                const info = await tradeApi.getInfo();

                dispatch(tradingActions.saveInfo(info));
            }

            if (isDifferentAccount || !buyInfo) {
                const buyInfoData = await dispatch(loadBuyInfoThunk()).unwrap();
                dispatch(tradingBuyActions.saveBuyInfo(buyInfoData));
            }

            if (isDifferentAccount || !exchangeInfo) {
                const exchangeInfoData = await dispatch(loadExchangeInfoThunk()).unwrap();

                dispatch(tradingExchangeActions.saveExchangeInfo(exchangeInfoData));
            }

            if (isDifferentAccount || !sellInfo) {
                const sellInfoData = await dispatch(loadSellInfoThunk()).unwrap();

                dispatch(tradingSellActions.saveSellInfo(sellInfoData));
            }

            dispatch(
                tradingActions.setLoading({
                    isLoading: false,
                    lastLoadedTimestamp: Date.now(),
                }),
            );
        }
    },
);
