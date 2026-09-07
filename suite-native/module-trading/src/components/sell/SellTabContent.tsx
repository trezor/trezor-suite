import { ServerOffline } from '@suite-native/trading-atoms';

import { SellForm } from './SellForm';
import { SellFormContextProvider } from './SellFormContextProvider';
import { SellFormSkeleton } from './SellFormSkeleton';
import { useSellData } from '../../hooks/sell/useSellData';

export const SellTabContent = () => {
    const { isLoading, lastLoadedTimestamp, isFullyLoaded, refetch } = useSellData();
    const isLoadingFinished = !isLoading && lastLoadedTimestamp > 0;

    if (isLoadingFinished && !isFullyLoaded) {
        return <ServerOffline onRetryPress={refetch} />;
    }

    if (!isFullyLoaded) {
        return <SellFormSkeleton />;
    }

    return (
        <SellFormContextProvider>
            <SellForm />
        </SellFormContextProvider>
    );
};
