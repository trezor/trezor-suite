import { useState } from 'react';

import { Text } from '@suite-native/atoms';

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

    return <Text variant="titleMedium">Sell is not implemented yet</Text>;
};
