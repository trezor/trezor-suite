import { UnknownAction, isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { deviceActions, formDraftActions } from '@suite-common/wallet-core';

import { buyActions } from '../reducers/buySlice';
import { exchangeActions } from '../reducers/exchangeSlice';
import { sellActions } from '../reducers/sellSlice';
import { tradingActions } from '../reducers/tradingSlice';

export const prepareTradingMiddleware = createMiddlewareWithExtraDeps(
    (action: UnknownAction, { dispatch, next }) => {
        next(action);

        if (
            isAnyOf(
                deviceActions.selectDevice,
                tradingActions.setTradingEnvironment,
                buyActions.clearState,
                exchangeActions.clearState,
                sellActions.clearState,
            )(action)
        ) {
            dispatch(formDraftActions.removeDraft({ key: 'trading-sell' }));
            dispatch(formDraftActions.removeDraft({ key: 'trading-exchange' }));
        }

        return action;
    },
);
