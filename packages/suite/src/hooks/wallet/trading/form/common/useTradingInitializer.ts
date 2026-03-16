import { useCallback } from 'react';

import { type TrezorDevice } from '@suite-common/suite-types';
import {
    INVITY_API_RELOAD_QUOTES_AFTER_SECONDS,
    tradingExchangeActions,
} from '@suite-common/trading';
import { type Timer, useTimer } from '@trezor/react-utils';

import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { selectIsWindowVisible } from 'src/reducers/suite/windowReducer';
import { type TradingPageType } from 'src/types/trading/trading';

export type UseTradingCommonProps = {
    pageType: TradingPageType;
    isLoading: boolean;
};
export interface UseTradingCommonReturnProps {
    timer: Timer;
    device: TrezorDevice | undefined;
    checkQuotesTimer: (callback: () => Promise<void>) => void;
}

export const useTradingInitializer = ({
    pageType,
    isLoading,
}: UseTradingCommonProps): UseTradingCommonReturnProps => {
    const dispatch = useDispatch();
    const timer = useTimer();
    const { device } = useDevice();

    const isWindowVisible = useSelector(selectIsWindowVisible);

    const checkQuotesTimer = useCallback(
        (callback: () => Promise<void>) => {
            if (isLoading) return;

            if (!timer.isLoading && !timer.isStopped) {
                if (timer.resetCount >= 40) {
                    timer.stop();
                }

                if (pageType === 'confirm' || pageType === 'retry') {
                    timer.stop();

                    return;
                }

                if (
                    isWindowVisible &&
                    timer.timeSpent.seconds >= INVITY_API_RELOAD_QUOTES_AFTER_SECONDS
                ) {
                    dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
                    callback();
                }
            }
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
