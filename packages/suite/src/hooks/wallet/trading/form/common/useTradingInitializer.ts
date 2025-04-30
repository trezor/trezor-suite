import { useCallback, useState } from 'react';

import { INVITY_API_RELOAD_QUOTES_AFTER_SECONDS } from '@suite-common/trading';
import { useTimer } from '@trezor/react-utils';

import { useDevice } from 'src/hooks/suite';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { UseTradingCommonProps, UseTradingCommonReturnProps } from 'src/types/trading/trading';

export const useTradingInitializer = ({
    selectedAccount,
    pageType,
}: UseTradingCommonProps): UseTradingCommonReturnProps => {
    const timer = useTimer();
    const { account } = selectedAccount;
    const { device } = useDevice();
    const [callInProgress, setCallInProgress] = useState<boolean>(false);

    const checkQuotesTimer = useCallback(
        (callback: () => Promise<void>) => {
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
        [timer, pageType],
    );

    useServerEnvironment();

    return {
        callInProgress,
        account,
        timer,
        device,
        setCallInProgress,
        checkQuotesTimer,
    };
};
