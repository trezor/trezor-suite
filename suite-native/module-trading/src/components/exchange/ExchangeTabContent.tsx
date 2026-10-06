import { ServerOffline } from '@suite-native/trading-atoms';

import { ExchangeForm } from './ExchangeForm';
import { ExchangeFormContextProvider } from './ExchangeFormContextProvider';
import { ExchangeFormSkeleton } from './ExchangeFormSkeleton';
import { useExchangeData } from '../../hooks/exchange/useExchangeData';

export const ExchangeTabContent = () => {
    const { isLoading, lastLoadedTimestamp, isFullyLoaded, refetch } = useExchangeData();
    const isLoadingFinished = !isLoading && lastLoadedTimestamp > 0;

    if (isLoadingFinished && !isFullyLoaded) {
        return <ServerOffline onRetryPress={refetch} />;
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
