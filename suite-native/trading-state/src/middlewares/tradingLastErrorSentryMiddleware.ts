import { isAnyOf } from '@reduxjs/toolkit';

import { type AnyAction, createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
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

type TradingLastErrorSentryMiddlewareState = void;

export const prepareTradingLastErrorSentryMiddleware = createMiddlewareWithExtraDeps<
    void,
    AnyAction,
    TradingLastErrorSentryMiddlewareState
>((action, { next }) => {
    const isLastErrorMessageAction = isAnyOf(
        tradingBuyActions.setLastErrorMessage,
        tradingExchangeActions.setLastErrorMessage,
        tradingSellActions.setLastErrorMessage,
    )(action);

    if (isLastErrorMessageAction && !!action.payload) {
        captureSentryException(new TradingError(action.payload));
    }

    return next(action);
});
