import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import {
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { captureSentryException } from '@suite-native/sentry';

class TradingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TradingError';
    }
}

export const prepareTradingLastErrorSentryMiddleware = createMiddlewareWithExtraDeps(
    (action, { next }) => {
        const isLastErrorMessageAction = isAnyOf(
            tradingBuyActions.setLastErrorMessage,
            tradingExchangeActions.setLastErrorMessage,
            tradingSellActions.setLastErrorMessage,
        )(action);

        if (isLastErrorMessageAction && !!action.payload) {
            console.warn(new TradingError(action.payload));
            captureSentryException(new TradingError(action.payload));
        }

        return next(action);
    },
);
