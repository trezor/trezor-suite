import { useEffect, useReducer } from 'react';

import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import { INVITY_API_RELOAD_QUOTES_AFTER_SECONDS } from '@suite-common/trading';

import { type TradingTimer } from 'src/hooks/wallet/trading/form/common/useTradingTimer';

import { TradingRefreshTime } from '../TradingRefreshTime';

type TradingHeaderRefreshTimeProps = {
    timer: TradingTimer;
    titleTimer: ExtendedMessageDescriptor['id'];
};

export const TradingHeaderRefreshTime = ({ timer, titleTimer }: TradingHeaderRefreshTimeProps) => {
    const [, tick] = useReducer((value: number) => value + 1, 0);

    useEffect(() => {
        if (timer.isStopped || timer.isLoading) {
            return;
        }

        const interval = setInterval(() => {
            tick();
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [timer.isStopped, timer.isLoading, timer.resetCount]);

    return (
        <TradingRefreshTime
            isLoading={timer.isLoading}
            refetchInterval={INVITY_API_RELOAD_QUOTES_AFTER_SECONDS}
            seconds={timer.secondsElapsed}
            label={<Translation id={titleTimer} />}
        />
    );
};
