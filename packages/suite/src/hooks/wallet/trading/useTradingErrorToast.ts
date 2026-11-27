import { useTranslation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type TradingError, isSilentTradingError } from '@suite-common/trading';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { getTradingErrorTranslation } from '#src/utils/wallet/trading/tradingErrorUtils';

export const useTradingErrorToast = () => {
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();

    const showTradingErrorToast = (tradingError: TradingError) => {
        // The shared push thunk already reports broadcast failures.
        if (isSilentTradingError(tradingError) || tradingError.code === 'push-transaction-failed') {
            return;
        }

        const { id, values } = getTradingErrorTranslation(tradingError);

        dispatch(
            notificationsActions.addToast({
                type: tradingError.type,
                error: translationString(id, values),
            }),
        );
    };

    return { showTradingErrorToast };
};
