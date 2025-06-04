import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { BuyForm } from './BuyForm';
import { BuyFormContextProvider } from './BuyFormContextProvider';
import { BuyFormSkeleton } from './BuyFormSkeleton';
import { useBuyData } from '../../hooks/buy/useBuyData';
import { selectIsTradingBuyEnabled } from '../../selectors/commonSelectors';
import { ServerOffline } from '../general/Error/ServerOffline';
import { TradingTypeDisabled } from '../general/Error/TradingTypeDisabled';

const BuyTabEnabled = () => {
    const [reloadOrdinal, setReloadOrdinal] = useState(0);
    const { isLoading, lastLoadedTimestamp, isFullyLoaded } = useBuyData(reloadOrdinal);
    const isLoadingFinished = !isLoading && lastLoadedTimestamp > 0;
    const wasSkeletonDisplayed = useRef(!isLoadingFinished);

    if (isLoadingFinished && !isFullyLoaded) {
        return <ServerOffline onRetryPress={() => setReloadOrdinal(reloadOrdinal + 1)} />;
    }

    if (!isFullyLoaded) {
        return <BuyFormSkeleton />;
    }

    return (
        <BuyFormContextProvider>
            <BuyForm shouldAnimateEntering={wasSkeletonDisplayed.current} />
        </BuyFormContextProvider>
    );
};

export const BuyTab = () => {
    const isBuyEnabled = useSelector(selectIsTradingBuyEnabled);

    if (!isBuyEnabled) {
        return <TradingTypeDisabled tradingType="buy" />;
    }

    return <BuyTabEnabled />;
};
