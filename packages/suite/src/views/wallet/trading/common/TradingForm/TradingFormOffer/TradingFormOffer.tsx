import { type TradingType } from '@suite-common/trading';
import { Column } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingFormOfferBuyActions } from 'src/views/wallet/trading/buy/TradingFormOfferBuyActions';
import { TradingUtilsTorWarning } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsTorWarning';
import { TradingFormOfferExchangeActions } from 'src/views/wallet/trading/exchange/TradingFormOfferExchangeActions';
import { TradingFormOfferSellActions } from 'src/views/wallet/trading/sell/TradingFormOfferSellActions';

import { TradingFormOfferAmount } from './components/TradingFormOfferAmount/TradingFormOfferAmount';
import { TradingFormOfferWarnings } from './components/TradingFormOffersWarnings';
import { useTradingFormOfferCommon } from './hooks/useTradingFormOfferCommon';

const getActionsComponent = (type: TradingType) => {
    switch (type) {
        case 'buy':
            return <TradingFormOfferBuyActions />;
        case 'sell':
            return <TradingFormOfferSellActions />;
        case 'exchange':
            return <TradingFormOfferExchangeActions />;
    }
};

export const TradingFormOffer = () => {
    const { type } = useTradingFormContext();
    const {
        quote,
        noOffersWithTor,
        sendAmount,
        receiveAmount,
        selectedAssetCryptoId,
        amountLabels,
        shouldDisplayFiatAmount,
    } = useTradingFormOfferCommon();

    return (
        <Column gap={20}>
            <TradingFormOfferAmount
                amount={receiveAmount}
                sendAmount={sendAmount}
                selectedAssetCryptoId={selectedAssetCryptoId ?? undefined}
                shouldDisplayFiatAmount={shouldDisplayFiatAmount}
                amountLabels={amountLabels}
            />
            <TradingFormOfferWarnings hasQuote={!!quote} />
            {noOffersWithTor && <TradingUtilsTorWarning tradingType={type} noOffer={!quote} />}
            {getActionsComponent(type)}
        </Column>
    );
};
