import { useEffect, useState } from 'react';

import {
    INVITY_API_RELOAD_QUOTES_AFTER_SECONDS,
    clamp,
    selectTradingQuoteRefetchingState,
} from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';

export const useTradingRefetchCountdown = () => {
    const { lastFetchTimestamp, status } = useSelector(selectTradingQuoteRefetchingState);
    const [remaining, setRemaining] = useState(INVITY_API_RELOAD_QUOTES_AFTER_SECONDS);

    useEffect(() => {
        if (status !== 'running' || !lastFetchTimestamp) {
            setRemaining(INVITY_API_RELOAD_QUOTES_AFTER_SECONDS);

            return;
        }

        const tick = () => {
            const elapsed = Math.floor((Date.now() - lastFetchTimestamp) / 1000);
            setRemaining(
                clamp(
                    INVITY_API_RELOAD_QUOTES_AFTER_SECONDS - elapsed,
                    0,
                    INVITY_API_RELOAD_QUOTES_AFTER_SECONDS,
                ),
            );
        };

        tick();
        const id = setInterval(tick, 1000);

        return () => clearInterval(id);
    }, [lastFetchTimestamp, status]);

    return remaining;
};
