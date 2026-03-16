import { createThunk } from '@suite-common/redux-utils';
import { type ErrorToastPayload, notificationsActions } from '@suite-common/toast-notifications';

import { TRADING_THUNK_PREFIX } from '../../constants';
import { type TradingType } from '../../types';
import { setLastErrorMessageByTradingType } from '../common/setLastErrorMessageByTradingType';

export type LogErrorThunkProps = {
    errorMessage: ErrorToastPayload['error'];
    toastType?: ErrorToastPayload['type'];
    tradingType: TradingType;
};

export const logErrorThunk = createThunk(
    `${TRADING_THUNK_PREFIX}/logError`,
    ({ errorMessage, tradingType, toastType = 'error' }: LogErrorThunkProps, { dispatch }) => {
        dispatch(
            notificationsActions.addToast({
                type: toastType,
                error: errorMessage,
            }),
        );

        dispatch(
            setLastErrorMessageByTradingType({
                tradingType,
                errorMessage,
            }),
        );
    },
);
