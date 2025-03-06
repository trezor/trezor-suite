import { ExtraDependencies, createThunk } from '@suite-common/redux-utils';

import { buyThunks } from '../';
import { INVITY_API_RELOAD_DATA_AFTER_MS, TRADING_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingActions } from '../../reducers/tradingReducer';
import {
    TradingRootState,
    selectTradingBuyInfo,
    selectTradingInfo,
    selectTradingLoadingAndTimestamp,
} from '../../selectors/tradingSelectors';
import { TradingType } from '../../types';

export interface LoadInitialDataThunkProps {
    activeSection: TradingType;
}

export const getAccountAccordingToSection = (state: TradingRootState, extra: ExtraDependencies) => {
    const { account } = extra.selectors.selectSelectedAccount(state);

    return account;
};

export const loadInitialDataThunk = createThunk(
    `${TRADING_THUNK_PREFIX}/loadInitialData`,
    async ({ activeSection }: LoadInitialDataThunkProps, { dispatch, getState, extra }) => {
        const account = getAccountAccordingToSection(getState(), extra);
        const buyInfo = selectTradingBuyInfo(getState());
        const { isLoading, lastLoadedTimestamp } = selectTradingLoadingAndTimestamp(getState());
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
    },
);
