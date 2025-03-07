import { ExtraDependencies, createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { INVITY_API_RELOAD_DATA_AFTER_MS } from '../constants';
import { invityAPI } from '../invityAPI';
import { tradingBuyActions } from '../reducers/buyReducer';
import { tradingActions } from '../reducers/tradingReducer';
import {
    TradingRootState,
    selectTradingBuy,
    selectTradingInfo,
    selectTradingLoadingAndTimestamp,
} from '../selectors/tradingSelectors';
import { buyThunks } from '../thunks';

export const getAccountAccordingToSection = (state: TradingRootState, extra: ExtraDependencies) => {
    const { account } = extra.selectors.selectSelectedAccount(state);

    return account;
};

export const prepareTradingMiddleware = createMiddlewareWithExtraDeps(
    async (action, { dispatch, next, getState, extra }) => {
        const { isLoading, lastLoadedTimestamp } = selectTradingLoadingAndTimestamp(getState());

        if (action.type === tradingActions.loadInvityData.type) {
            const account = getAccountAccordingToSection(getState(), extra);
            const { platforms, coins } = selectTradingInfo(getState());
            const { buyInfo } = selectTradingBuy(getState());

            const currentAccountDescriptor = invityAPI.getCurrentAccountDescriptor();
            const isDifferentAccount = currentAccountDescriptor !== account?.descriptor;
            const areDataOutdated =
                lastLoadedTimestamp + INVITY_API_RELOAD_DATA_AFTER_MS < Date.now();

            if (account && !isLoading && (isDifferentAccount || areDataOutdated)) {
                dispatch(tradingActions.setLoading({ isLoading: true }));

                const invityServerEnvironment =
                    extra.selectors.selectTradingEnvironment(getState());
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

                dispatch(
                    tradingActions.setLoading({
                        isLoading: false,
                        lastLoadedTimestamp: Date.now(),
                    }),
                );
            }
        }

        return next(action);
    },
);
