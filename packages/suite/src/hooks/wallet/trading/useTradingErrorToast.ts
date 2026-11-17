import { notificationsActions } from '@suite-common/toast-notifications';
import { type TradingError, isSilentTradingError } from '@suite-common/trading';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { getTradingErrorTranslation } from '#src/utils/wallet/trading/tradingErrorUtils';

import { useComposeErrorText } from '../useComposeErrorText';

export const useTradingErrorToast = () => {
    const { dispatch } = useServices(injectDispatch);
    const getComposeErrorText = useComposeErrorText();

    const showTradingErrorToast = (tradingError: TradingError) => {
        if (isSilentTradingError(tradingError)) {
            return;
        }

        const { id, ...message } = getTradingErrorTranslation(tradingError);

        dispatch(
            notificationsActions.addToast({
                type: tradingError.type,
                error: getComposeErrorText(id, message),
            }),
        );
    };

    return { showTradingErrorToast };
};
