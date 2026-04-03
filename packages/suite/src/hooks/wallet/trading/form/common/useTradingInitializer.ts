import { useCallback } from 'react';

import { type TrezorDevice } from '@suite-common/suite-types';
import {
    INVITY_API_RELOAD_QUOTES_AFTER_SECONDS,
    selectTradingFetchCount,
    selectTradingQuotesTimer,
    tradingActions,
    tradingExchangeActions,
} from '@suite-common/trading';

import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useServerEnvironment } from 'src/hooks/wallet/trading/useServerEnviroment';
import { selectIsWindowVisible } from 'src/reducers/suite/windowReducer';
import { type TradingPageType } from 'src/types/trading/trading';

export type UseTradingCommonProps = {
    pageType: TradingPageType;
    isLoading: boolean;
};
export interface UseTradingCommonReturnProps {
    device: TrezorDevice | undefined;
    checkQuotesTimer: (callback: () => Promise<void>) => void;
}

const MAX_FETCH_COUNT = 40;

export const useTradingInitializer = ({
    pageType,
    isLoading,
}: UseTradingCommonProps): UseTradingCommonReturnProps => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const isWindowVisible = useSelector(selectIsWindowVisible);
    const quotesTimer = useSelector(selectTradingQuotesTimer);
    const fetchCount = useSelector(selectTradingFetchCount);

    const checkQuotesTimer = useCallback(
        (callback: () => Promise<void>) => {
            if (isLoading) return;

            if (quotesTimer.status === 'loading') return;

            if (fetchCount >= MAX_FETCH_COUNT) {
                dispatch(tradingActions.setQuotesTimer({ status: 'stopped' }));

                return;
            }

            if (pageType === 'confirm' || pageType === 'retry') {
                dispatch(tradingActions.setQuotesTimer({ status: 'stopped' }));

                return;
            }

            if (quotesTimer.status !== 'running') return;

            const elapsedSeconds = Math.floor((Date.now() - quotesTimer.fetchedAt) / 1000);
            const hasRefreshIntervalElapsed =
                elapsedSeconds >= INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;

            if (!hasRefreshIntervalElapsed) return;

            if (!isWindowVisible) {
                dispatch(tradingActions.setQuotesTimer({ status: 'stopped' }));

                return;
            }

            dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
            callback();
        },
        [quotesTimer, fetchCount, isWindowVisible, pageType, isLoading, dispatch],
    );

    useServerEnvironment();

    return {
        device,
        checkQuotesTimer,
    };
};
