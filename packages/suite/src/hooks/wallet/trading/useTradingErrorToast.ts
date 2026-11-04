import { useTranslation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type TradingError, isSilentSendRejection } from '@suite-common/trading';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { getTradingErrorTranslation } from 'src/utils/wallet/trading/tradingErrorUtils';

/**
 * Shows a trading error as a toast, unless the user already knows why the flow stopped.
 */
export const useTradingErrorToast = () => {
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();

    const showTradingErrorToast = (tradingError: TradingError) => {
        if (isSilentSendRejection(tradingError.type)) {
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
