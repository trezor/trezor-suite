import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    selectTradingProviderByNameAndTradeType,
    selectTradingSellSelectedQuote,
} from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';

import { useTradingSellConfirm } from 'src/hooks/wallet/trading/useTradingSellConfirm';
import { DiscoveryWarning } from 'src/views/wallet/staking/components/StakingDashboard/components/DiscoveryWarning';
import { TradingFooter } from 'src/views/wallet/trading/common/TradingFooter/TradingFooter';
import { useTradingPageHeader } from 'src/views/wallet/trading/common/TradingLayout/useTradingPageHeader';
import { TradingOfferSell } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferSell/TradingOfferSell';

export const TradingSellConfirm = () => {
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
