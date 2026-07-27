import { createThunk } from '@suite-common/redux-utils';
import { type ErrorToastPayload, notificationsActions } from '@suite-common/toast-notifications';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingType } from '../../types';
import {
    type ResolvedTradeError,
    isResolvedTradeError,
} from '../../utils/exchange/resolveExchangeTradeError';
import { setLastErrorMessageByTradingType } from '../common/setLastErrorMessageByTradingType';

export type LogErrorThunkProps = {
    errorMessage: string | ResolvedTradeError;
    toastType?: ErrorToastPayload['type'];
    tradingType: TradingType;
};

export const logErrorThunk = createThunk(
    `${TRADING_THUNK_PREFIX}/logError`,
    ({ errorMessage, tradingType, toastType = 'error' }: LogErrorThunkProps, { dispatch }) => {
        if (isResolvedTradeError(errorMessage)) {
            dispatch(
                notificationsActions.addToast({
                    type: 'trading-error',
                    errorCode: errorMessage.code,
                    values: errorMessage.values,
                    message: errorMessage.message,
                }),
            );
            dispatch(
                setLastErrorMessageByTradingType({
                    tradingType,
                    errorMessage: errorMessage.message ?? '',
                }),
            );

            return;
        }

        dispatch(notificationsActions.addToast({ type: toastType, error: errorMessage }));
        dispatch(setLastErrorMessageByTradingType({ tradingType, errorMessage }));
    },
);
