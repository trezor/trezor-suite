import { ServerOffline } from '@suite-native/trading-atoms';

import { EXCHANGE_SEND_SECTION_BOTTOM_SPACING } from './ExchangeCard';
import { ExchangeForm } from './ExchangeForm';
import { ExchangeFormContextProvider } from './ExchangeFormContextProvider';
import { useExchangeData } from '../../hooks/exchange/useExchangeData';
import { TradingFormSkeleton } from '../general/TradingFormSkeleton';

export const ExchangeTabContent = () => {
    const { isLoading, lastLoadedTimestamp, isFullyLoaded, refetch } = useExchangeData();
    const isLoadingFinished = !isLoading && lastLoadedTimestamp > 0;

    if (isLoadingFinished && !isFullyLoaded) {
        return <ServerOffline onRetryPress={refetch} />;
    }

    if (!isFullyLoaded) {
        return (
            <TradingFormSkeleton
                hasSecondSectionBalanceRow
                firstSectionBottomSpacing={EXCHANGE_SEND_SECTION_BOTTOM_SPACING}
            />
        );
    }

    return (
        <ExchangeFormContextProvider>
            <ExchangeForm />
        </ExchangeFormContextProvider>
    );
};
