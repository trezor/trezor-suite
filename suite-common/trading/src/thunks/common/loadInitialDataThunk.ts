import { createThunk } from '@suite-common/redux-utils';

import { buyThunks, exchangeThunks } from '../';
import { INVITY_API_RELOAD_DATA_AFTER_MS, TRADING_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingActions } from '../../reducers/tradingReducer';
import {
    selectTradingAccountAccordingActiveSection,
    selectTradingBuyInfo,
    selectTradingBuyLoadingTimestampAndStatus,
    selectTradingExchangeInfo,
    selectTradingInfo,
} from '../../selectors/tradingSelectors';
import { TradingType } from '../../types';

export interface LoadInitialDataThunkProps {
    activeSection: TradingType;
}

export const loadInitialDataThunk = createThunk(
    `${TRADING_THUNK_PREFIX}/loadInitialData`,
    async ({ activeSection }: LoadInitialDataThunkProps, { dispatch, getState, extra }) => {
        const selectedAccount = extra.selectors.selectSelectedAccount(getState());
        const account = selectTradingAccountAccordingActiveSection(
            getState(),
            activeSection,
            selectedAccount,
        );
        const buyInfo = selectTradingBuyInfo(getState());
        const exchangeInfo = selectTradingExchangeInfo(getState());
        const { isLoading, lastLoadedTimestamp } =
            selectTradingBuyLoadingTimestampAndStatus(getState());
        const { platforms, coins } = selectTradingInfo(getState());

        const currentAccountDescriptor = invityAPI.getCurrentAccountDescriptor();
        const isDifferentAccount = currentAccountDescriptor !== account?.descriptor;
        const areDataOutdated = lastLoadedTimestamp + INVITY_API_RELOAD_DATA_AFTER_MS < Date.now();

        dispatch(tradingActions.setTradingActiveSection(activeSection));

        if (account && !isLoading && (isDifferentAccount || areDataOutdated)) {
            dispatch(tradingActions.setLoading({ isLoading: true }));

            const invityServerEnvironment = extra.selectors.selectTradingEnvironment(getState());
            if (invityServerEnvironment) {
                invityAPI.setInvityServersEnvironment(invityServerEnvironment);
            }

            invityAPI.createInvityAPIKey(account.descriptor);

            if (isDifferentAccount || !platforms || !coins) {
                const info = await invityAPI.getInfo();

                dispatch(tradingActions.saveInfo(info));
                // TODO: trading - delete this, just to avoiding trigger same request again
                dispatch({
                    type: '@trading-info/save-info',
                    info,
                });
            }

            if (isDifferentAccount || !buyInfo) {
                const buyInfoData = await dispatch(buyThunks.loadInfoThunk()).unwrap();

                dispatch(tradingBuyActions.saveBuyInfo(buyInfoData));
            }

            if (isDifferentAccount || !exchangeInfo) {
                const exchangeInfoData = await dispatch(exchangeThunks.loadInfoThunk()).unwrap();

                dispatch(tradingExchangeActions.saveExchangeInfo(exchangeInfoData));
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
