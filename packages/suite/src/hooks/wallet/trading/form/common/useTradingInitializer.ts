import { useCallback } from 'react';

import { type TrezorDevice } from '@suite-common/suite-types';
import {
    INVITY_API_RELOAD_QUOTES_AFTER_SECONDS,
    tradingExchangeActions,
} from '@suite-common/trading';

import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { selectIsWindowVisible } from 'src/reducers/suite/windowReducer';
import { type TradingPageType } from 'src/types/trading/trading';

import { type TradingTimer, useTradingTimer } from './useTradingTimer';

export type UseTradingCommonProps = {
    pageType: TradingPageType;
    isLoading: boolean;
};
export interface UseTradingCommonReturnProps {
    timer: TradingTimer;
    device: TrezorDevice | undefined;
    checkQuotesTimer: (callback: () => Promise<void>) => void;
}

export const useTradingInitializer = ({
    pageType,
    isLoading,
}: UseTradingCommonProps): UseTradingCommonReturnProps => {
    const dispatch = useDispatch();
    const timer = useTradingTimer();
    const { device } = useDevice();

    const isWindowVisible = useSelector(selectIsWindowVisible);

    const checkQuotesTimer = useCallback(
        (callback: () => Promise<void>) => {
            if (isLoading) return;

            if (timer.isLoading) {
                return;
            }

            if (timer.resetCount >= 40) {
                timer.stop();

                return;
            }

            if (pageType === 'confirm' || pageType === 'retry') {
                timer.stop();

                return;
            }

            const hasRefreshIntervalElapsed =
                timer.secondsElapsed >= INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;

            if (!hasRefreshIntervalElapsed) {
                return;
            }

            if (!isWindowVisible) {
                if (!timer.isStopped) {
                    timer.stop();
                }

                return;
            }

            if (timer.isStopped) {
                timer.reset();
            }

            dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
            callback();
        },
        [timer, isWindowVisible, pageType, isLoading, dispatch],
    );

    useServerEnvironment();

    return {
        timer,
        device,
        checkQuotesTimer,
    };
};
