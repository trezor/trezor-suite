import {
    selectTradingBuySelectedQuote,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Column } from '@trezor/components';
import {
    DiscoveryWarning,
    TradingFooter,
    TradingOfferBuy,
    useSelector,
    useTradingBuyConfirm,
    useTradingPageHeader,
} from '@trezor/suite';

export const TradingBuyConfirmPage = () => {
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
