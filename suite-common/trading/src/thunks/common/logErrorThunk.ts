import { type ErrorToastPayload, notificationsActions } from '@suite-common/toast-notifications';
import { createThunk } from '@trezor/redux-utils';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingType } from '../../types';
import {
    type ResolvedTradeError,
    isResolvedTradeError,
} from '../../utils/exchange/resolveExchangeTradeError';
import { setLastErrorMessageByTradingTypeThunk } from '../common/setLastErrorMessageByTradingType';

export type LogErrorThunkProps = {
    errorMessage: string | ResolvedTradeError;
    toastType?: ErrorToastPayload['type'];
    tradingType: TradingType;
    shouldSetLastErrorMessage?: boolean;
};

export const logErrorThunk = createThunk<void, LogErrorThunkProps, void>(
    `${TRADING_THUNK_PREFIX}/logError`,
    (
        { errorMessage, tradingType, toastType = 'error', shouldSetLastErrorMessage = true },
        { dispatch },
    ) => {
        if (isResolvedTradeError(errorMessage)) {
            dispatch(
                notificationsActions.addToast({
                    type: 'trading-error',
                    errorCode: errorMessage.code,
                    values: errorMessage.values,
                    message: errorMessage.message,
                }),
            );
            if (shouldSetLastErrorMessage) {
                dispatch(
                    setLastErrorMessageByTradingTypeThunk({
                        tradingType,
                        errorMessage: errorMessage.message ?? '',
                    }),
                );
            }

            return;
        }

        dispatch(notificationsActions.addToast({ type: toastType, error: errorMessage }));
        if (shouldSetLastErrorMessage) {
            dispatch(setLastErrorMessageByTradingTypeThunk({ tradingType, errorMessage }));
        }
    },
);
