import { createMiddleware } from '@suite-common/redux-utils';

import { tradingActions } from '../actions/tradingActions';
import { INVITY_API_RELOAD_DATA_AFTER_MS } from '../constants';
import { invityAPI } from '../invityAPI';
import { tradingBuyActions } from '../reducers/buyReducer';
import {
    TradingRootState,
    selectTradingBuy,
    selectTradingInfo,
    selectTradingLoadingAndTimestamp,
    selectTradingSelectedAccount,
    selectTradingSettingEnvironment,
} from '../selectors/tradingSelectors';
import { buyThunks } from '../thunks/buy';

export const getAccountAccordingToSection = (state: TradingRootState) => {
    const { account } = selectTradingSelectedAccount(state);

    return account;
};

export const tradingMiddleware = createMiddleware(async (action, { dispatch, next, getState }) => {
    const { isLoading, lastLoadedTimestamp } = selectTradingLoadingAndTimestamp(getState());

    if (action.type === tradingActions.loadInvityData.type) {
        const account = getAccountAccordingToSection(getState());
        const { platforms, coins } = selectTradingInfo(getState());
        const { buyInfo } = selectTradingBuy(getState());

        const currentAccountDescriptor = invityAPI.getCurrentAccountDescriptor();
        const isDifferentAccount = currentAccountDescriptor !== account?.descriptor;
        const areDataOutdated = lastLoadedTimestamp + INVITY_API_RELOAD_DATA_AFTER_MS < Date.now();

        if (account && !isLoading && (isDifferentAccount || areDataOutdated)) {
            dispatch(tradingActions.setLoading(true));

            const invityServerEnvironment = selectTradingSettingEnvironment(getState());
            if (invityServerEnvironment) {
                invityAPI.setInvityServersEnvironment(invityServerEnvironment);
            }

            invityAPI.createInvityAPIKey(account.descriptor);

            if (isDifferentAccount || !platforms || !coins) {
                const info = await invityAPI.getInfo();

                dispatch(tradingActions.saveInfo(info));
            }

            if (isDifferentAccount || !buyInfo) {
                const buyInfoData = await dispatch(buyThunks.loadInfoThunk()).unwrap();

                dispatch(tradingBuyActions.saveBuyInfo(buyInfoData));
            }

            dispatch(tradingActions.setLoading(false, Date.now()));
        }
    }

    return next(action);
});
