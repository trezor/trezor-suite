import { useState } from 'react';

import { ServerOffline } from '@suite-native/trading-atoms';

import { ExchangeForm } from './ExchangeForm';
import { ExchangeFormContextProvider } from './ExchangeFormContextProvider';
import { ExchangeFormSkeleton } from './ExchangeFormSkeleton';
import { useExchangeData } from '../../hooks/exchange/useExchangeData';

export const ExchangeTabContent = () => {
    const [reloadOrdinal, setReloadOrdinal] = useState(0);
    const { isLoading, lastLoadedTimestamp, isFullyLoaded } = useExchangeData(reloadOrdinal);
    const isLoadingFinished = !isLoading && lastLoadedTimestamp > 0;

    if (isLoadingFinished && !isFullyLoaded) {
        return <ServerOffline onRetryPress={() => setReloadOrdinal(n => n + 1)} />;
    }

    if (!isFullyLoaded) {
        return <ExchangeFormSkeleton />;
    }

    return (
        <ExchangeFormContextProvider>
            <ExchangeForm />
        </ExchangeFormContextProvider>
    );
};
