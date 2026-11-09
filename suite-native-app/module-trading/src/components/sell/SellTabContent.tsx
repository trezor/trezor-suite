import { ServerOffline } from '@suite-native/trading-atoms';

import { SellForm } from './SellForm';
import { SellFormContextProvider } from './SellFormContextProvider';
import { useSellData } from '../../hooks/sell/useSellData';
import { TradingFormSkeleton } from '../general/TradingFormSkeleton';

export const SellTabContent = () => {
    const { isLoading, lastLoadedTimestamp, isFullyLoaded, refetch } = useSellData();
    const isLoadingFinished = !isLoading && lastLoadedTimestamp > 0;

    if (isLoadingFinished && !isFullyLoaded) {
        return <ServerOffline onRetryPress={refetch} />;
    }

    if (!isFullyLoaded) {
        return <TradingFormSkeleton hasResidenceField />;
    }

    return (
        <SellFormContextProvider>
            <SellForm />
        </SellFormContextProvider>
    );
};
