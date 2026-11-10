import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    selectTradingProviderByNameAndTradeType,
    selectTradingSellSelectedQuote,
} from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';
import {
    DiscoveryWarning,
    TradingFooter,
    TradingOfferSell,
    useTradingPageHeader,
    useTradingSellConfirm,
} from '@trezor/suite';

export const TradingSellConfirmPage = () => {
    const { requestTrade, isRequestDisabled } = useTradingSellConfirm();
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const provider = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, selectedQuote?.exchange, 'sell'),
    );
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    useTradingPageHeader();

    return (
        <>
            {isDiscoveryRunning && (
                <Column margin={{ bottom: 16 }}>
                    <DiscoveryWarning />
                </Column>
            )}
            <TradingOfferSell requestTrade={requestTrade} isRequestDisabled={isRequestDisabled} />
            <TradingFooter provider={provider} />
        </>
    );
};
