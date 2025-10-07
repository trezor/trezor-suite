import { UnknownAction, isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { deviceActions, formDraftActions } from '@suite-common/wallet-core';
import { getFormDraftKey } from '@suite-common/wallet-utils';

import { buyActions, exchangeActions, sellActions, tradingActions } from '../reducers';

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
            dispatch(formDraftActions.removeDraft({ key: getFormDraftKey('trading-sell', '') }));
            dispatch(
                formDraftActions.removeDraft({ key: getFormDraftKey('trading-exchange', '') }),
            );
        }

        return action;
    },
);
