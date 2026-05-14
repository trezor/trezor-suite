import { createThunk } from '@suite-common/redux-utils';

import { INVITY_API_RELOAD_DATA_AFTER_MS, TRADING_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingSellActions } from '../../reducers/sellReducer';
import { tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingAccountAccordingActiveSection,
    selectTradingBuyInfo,
    selectTradingExchangeInfo,
    selectTradingInfo,
    selectTradingLoadingAndTimestamp,
    selectTradingSellInfo,
} from '../../selectors/tradingSelectors';
import { type TradingType } from '../../types';
import { loadBuyInfoThunk } from '../buy/loadBuyInfoThunk';
import { loadExchangeInfoThunk } from '../exchange/loadExchangeInfoThunk';
import { loadSellInfoThunk } from '../sell/loadSellInfoThunk';

export interface LoadInitialDataThunkProps {
    activeSection: TradingType;
    forcedApiKey?: string;
}

export const loadInitialDataThunk = createThunk(
    `${TRADING_THUNK_PREFIX}/loadInitialData`,
    async (
        { activeSection, forcedApiKey }: LoadInitialDataThunkProps,
        { dispatch, getState, extra },
    ) => {
        const selectedAccount = extra.selectors.selectSelectedAccount(getState());
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

        const currentAccountDescriptor = invityAPI.getCurrentAccountDescriptor();
        const isDifferentAccount = currentAccountDescriptor !== account?.descriptor;
        const areDataOutdated = lastLoadedTimestamp + INVITY_API_RELOAD_DATA_AFTER_MS < Date.now();

        dispatch(tradingActions.setTradingActiveSection(activeSection));

        if ((account || forcedApiKey) && !isLoading && (isDifferentAccount || areDataOutdated)) {
            dispatch(tradingActions.setLoading({ isLoading: true }));

            const invityServerEnvironment = extra.selectors.selectTradingEnvironment(getState());
            if (invityServerEnvironment) {
                invityAPI.setInvityServersEnvironment(invityServerEnvironment);
            }

            // use account descriptor or forcedApiKey - one of these two must be provided to get here
            const apiKey = account?.descriptor || forcedApiKey!;
            invityAPI.createInvityAPIKey(apiKey);

            if (isDifferentAccount || !platforms || !coins) {
                const info = await invityAPI.getInfo();

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
