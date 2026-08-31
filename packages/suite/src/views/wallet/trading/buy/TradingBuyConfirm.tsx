import { useSelector } from '@suite-common/redux-utils';
import {
    selectTradingBuySelectedQuote,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';

import { useTradingBuyConfirm } from 'src/hooks/wallet/trading/useTradingBuyConfirm';
import { DiscoveryWarning } from 'src/views/wallet/staking/components/StakingDashboard/components/DiscoveryWarning';
import { TradingFooter } from 'src/views/wallet/trading/common/TradingFooter/TradingFooter';
import { useTradingPageHeader } from 'src/views/wallet/trading/common/TradingLayout/useTradingPageHeader';
import { TradingOfferBuy } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferBuy/TradingOfferBuy';

export const TradingBuyConfirm = () => {
    const { confirmTrade, isConfirmDisabled } = useTradingBuyConfirm();
    const selectedQuote = useSelector(selectTradingBuySelectedQuote);
    const provider = useSelector(state =>
        selectTradingProviderByNameAndTradeType(state, selectedQuote?.exchange, 'buy'),
    );
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    useTradingPageHeader();

    if (!selectedQuote) {
        return null;
    }

    return (
        <>
            {isDiscoveryRunning && (
                <Column margin={{ bottom: 16 }}>
                    <DiscoveryWarning />
                </Column>
            )}
            <TradingOfferBuy
                selectedQuote={selectedQuote}
                confirmTrade={confirmTrade}
                isConfirmDisabled={isConfirmDisabled}
            />
            <TradingFooter provider={provider} />
        </>
    );
};
