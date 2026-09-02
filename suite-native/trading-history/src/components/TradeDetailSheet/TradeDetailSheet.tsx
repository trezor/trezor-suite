import { memo, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type TradingRootState, selectTradingTradeByOrderId } from '@suite-common/trading';
import { BottomSheetModal, useBottomSheetModal } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { Footer } from '@suite-native/trading-provider-utils';
import { getTradeOperationData, getTradeTitle } from '@suite-native/trading-quote-utils';
import { selectTradingResidenceCountry } from '@suite-native/trading-state';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TradeDetailFooter } from './TradeDetailFooter';
import { TradeDetailHeader } from './TradeDetailHeader';
import { TradeDetailInfo } from './TradeDetailInfo';
import { TradeDetailProviderCard } from './TradeDetailProviderCard';
import { TradeDetailTransactionInfo } from './TradeDetailTransactionInfo';
import { TradingDetailFeedback } from '../TradeHistoryListItem/TradingDetailFeedback';

type TradeDetailSheetProps = {
    orderId?: string;
    isVisible: boolean;
    onDismiss: () => void;
};

const bottomSheetStyle = prepareNativeStyle(({ spacings }) => ({
    gap: spacings.sp16,
    marginVertical: spacings.sp10,
}));

export const TradeDetailSheet = memo(({ orderId, isVisible, onDismiss }: TradeDetailSheetProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    const countryOfResidence = useSelector(selectTradingResidenceCountry);

    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    useEffect(() => {
        if (isVisible) {
            openModal();
        }
    }, [isVisible, openModal]);

    if (!orderId || !trade) {
        return null;
    }

    const onOpenedBrowser = () => {
        closeModal();
    };

    const tradeTitle = getTradeTitle(trade, translate);

    const { fromCurrency, toCurrency } = getTradeOperationData(trade.data);

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            onDismiss={onDismiss}
            style={applyStyle(bottomSheetStyle)}
            title={tradeTitle}
            isCloseDisplayed
        >
            <TradeDetailHeader orderId={orderId} onOpenedBrowser={onOpenedBrowser} />
            <TradeDetailProviderCard orderId={orderId} />
            <TradeDetailTransactionInfo orderId={orderId} />
            <TradeDetailInfo orderId={orderId} />
            <TradeDetailFooter orderId={orderId} />
            <TradingDetailFeedback
                type={trade.tradeType}
                status={trade.data.status}
                provider={trade.data.exchange}
                id={trade.data.id}
                sendCurrency={fromCurrency}
                receiveCurrency={toCurrency}
                country={countryOfResidence}
            />
            <Footer />
        </BottomSheetModal>
    );
});
