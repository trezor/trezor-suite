import { UnknownAction, isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { deviceActions, formDraftActions } from '@suite-common/wallet-core';

import { buyActions, exchangeActions, sellActions, tradingActions } from '../reducers';
import { getFormDraftKeyByTradeType } from '../utils';

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
            dispatch(formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('sell') }));
            dispatch(formDraftActions.removeDraft({ key: getFormDraftKeyByTradeType('exchange') }));
        }

        return action;
    },
);
