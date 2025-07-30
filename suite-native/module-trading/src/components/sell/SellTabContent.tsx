import { useState } from 'react';

import { SellForm } from './SellForm';
import { SellFormContextProvider } from './SellFormContextProvider';
import { SellFormSkeleton } from './SellFormSkeleton';
import { useSellData } from '../../hooks/sell/useSellData';
import { ServerOffline } from '../general/Error/ServerOffline';

export const SellTabContent = () => {
    const [reloadOrdinal, setReloadOrdinal] = useState(0);
    const { isLoading, lastLoadedTimestamp, isFullyLoaded } = useSellData(reloadOrdinal);
    const isLoadingFinished = !isLoading && lastLoadedTimestamp > 0;

    if (isLoadingFinished && !isFullyLoaded) {
        return <ServerOffline onRetryPress={() => setReloadOrdinal(reloadOrdinal + 1)} />;
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
