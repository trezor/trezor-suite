import { useState } from 'react';

import { ServerOffline } from '@suite-native/trading-atoms';

import { SellForm } from './SellForm';
import { SellFormContextProvider } from './SellFormContextProvider';
import { SellFormSkeleton } from './SellFormSkeleton';
import { useSellData } from '../../hooks/sell/useSellData';

export const SellTabContent = () => {
    const [reloadOrdinal, setReloadOrdinal] = useState(0);
    const { isLoading, lastLoadedTimestamp, isFullyLoaded } = useSellData(reloadOrdinal);
    const isLoadingFinished = !isLoading && lastLoadedTimestamp > 0;

    if (isLoadingFinished && !isFullyLoaded) {
        return <ServerOffline onRetryPress={() => setReloadOrdinal(n => n + 1)} />;
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
