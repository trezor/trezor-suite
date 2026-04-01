import { Context } from '@suite-common/message-system';
import { selectTradingExchangeQuotes } from '@suite-common/trading';
import { Column } from '@trezor/components';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useSelector } from 'src/hooks/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';
import { TradingHeader } from 'src/views/wallet/trading/common/TradingHeader/TradingHeader';
import { TradingOffersEmpty } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersEmpty';
import { TradingOffersExchange } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersExchange';

export const TradingExchangeOffersContent = () => {
    const quotes = useSelector(selectTradingExchangeQuotes);
    const noOffers = !quotes || quotes.length === 0;
    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    return (
        <>
            {tradingDeviceDisconnected && <ConnectDeviceGenericPromo />}

            <TradingHeader title="TR_TRADING_SHOW_OFFERS" titleTimer="TR_TRADING_OFFERS_REFRESH" />

            <Column gap={16} margin={{ top: 16 }}>
                {noOffers ? <TradingOffersEmpty /> : <TradingOffersExchange />}

                <ContextMessage context={Context.getLegal('gateway')} />
            </Column>
        </>
    );
};
