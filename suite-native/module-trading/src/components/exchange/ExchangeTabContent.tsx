import { useRef, useState } from 'react';

import { ExchangeForm } from './ExchangeForm';
import { ExchangeFormContextProvider } from './ExchangeFormContextProvider';
import { ExchangeFormSkeleton } from './ExchangeFormSkeleton';
import { useExchangeData } from '../../hooks/exchange/useExchangeData';
import { ServerOffline } from '../general/Error/ServerOffline';

export const ExchangeTabContent = () => {
    const [reloadOrdinal, setReloadOrdinal] = useState(0);
    const { isLoading, lastLoadedTimestamp, isFullyLoaded } = useExchangeData(reloadOrdinal);
    const isLoadingFinished = !isLoading && lastLoadedTimestamp > 0;
    const wasSkeletonDisplayed = useRef(!isLoadingFinished);

    if (isLoadingFinished && !isFullyLoaded) {
        return <ServerOffline onRetryPress={() => setReloadOrdinal(reloadOrdinal + 1)} />;
    }

    if (!isFullyLoaded) {
        return <ExchangeFormSkeleton />;
    }

    return (
        <ExchangeFormContextProvider>
            <ExchangeForm shouldAnimateEntering={wasSkeletonDisplayed.current} />
        </ExchangeFormContextProvider>
    );
};
