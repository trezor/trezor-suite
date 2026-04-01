import { Context } from '@suite-common/message-system';
import { selectTradingBuyBestQuote, selectTradingBuyQuotes } from '@suite-common/trading';
import { Column } from '@trezor/components';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useSelector } from 'src/hooks/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';
import { TradingHeader } from 'src/views/wallet/trading/common/TradingHeader/TradingHeader';
import { TradingOffersEmpty } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersEmpty';
import { TradingOffersItem } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersItem';
import { TradingUtilsTorWarning } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsTorWarning';

export const TradingBuyOffersContent = () => {
    const quotes = useSelector(selectTradingBuyQuotes);
    const bestRatedQuote = useSelector(selectTradingBuyBestQuote);
    const noOffers = !quotes || quotes.length === 0;
    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    return (
        <>
            {tradingDeviceDisconnected && <ConnectDeviceGenericPromo />}

            <TradingHeader title="TR_TRADING_SHOW_OFFERS" titleTimer="TR_TRADING_OFFERS_REFRESH" />

            <Column gap={16}>
                {noOffers ? (
                    <TradingOffersEmpty />
                ) : (
                    <Column gap={16} margin={{ top: 16 }}>
                        <TradingUtilsTorWarning tradingType="buy" noOffer={false} />
                        {quotes.map(quote => (
                            <TradingOffersItem
                                key={quote?.orderId}
                                quote={quote}
                                isBestRate={bestRatedQuote?.orderId === quote?.orderId}
                            />
                        ))}
                    </Column>
                )}

                <ContextMessage context={Context.getLegal('gateway')} />
            </Column>
        </>
    );
};
