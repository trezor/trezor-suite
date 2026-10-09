import { type UnknownAction, isAnyOf } from '@reduxjs/toolkit';

import {
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { captureSentryException } from '@suite-native/sentry';
import { createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

class TradingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TradingError';
    }
}

type TradingLastErrorSentryMiddlewareState = void;

export const prepareTradingLastErrorSentryMiddleware = createMiddlewareWithExtraDeps<
    void,
    UnknownAction,
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
