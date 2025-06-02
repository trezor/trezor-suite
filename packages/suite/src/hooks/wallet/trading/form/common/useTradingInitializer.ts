import { useCallback } from 'react';

import { INVITY_API_RELOAD_QUOTES_AFTER_SECONDS } from '@suite-common/trading';
import { useTimer } from '@trezor/react-utils';

import { useDevice } from 'src/hooks/suite';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { UseTradingCommonProps, UseTradingCommonReturnProps } from 'src/types/trading/trading';

export const useTradingInitializer = ({
    selectedAccount,
    pageType,
    isLoading,
}: UseTradingCommonProps): UseTradingCommonReturnProps => {
    const timer = useTimer();
    const { account } = selectedAccount;
    const { device } = useDevice();

    const checkQuotesTimer = useCallback(
        (callback: () => Promise<void>) => {
            if (isLoading) return;

            if (!timer.isLoading && !timer.isStopped) {
                if (timer.resetCount >= 40) {
                    timer.stop();
                }

                if (pageType === 'confirm') {
                    timer.stop();

                    return;
                }

                if (timer.timeSpent.seconds === INVITY_API_RELOAD_QUOTES_AFTER_SECONDS) {
                    callback();
                }
            }
        },
        [timer, pageType, isLoading],
    );

    useServerEnvironment();

    return {
        account,
        timer,
        device,
        checkQuotesTimer,
    };
};
