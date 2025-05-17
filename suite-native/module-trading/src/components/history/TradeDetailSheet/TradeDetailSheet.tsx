import { memo, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { TradingRootState, selectTradingTradeByOrderId } from '@suite-common/trading';
import { BottomSheetModal, useBottomSheetModal } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TradeDetailFooter } from './TradeDetailFooter';
import { TradeDetailHeader } from './TradeDetailHeader';
import { TradeDetailInfo } from './TradeDetailInfo';
import { TradeDetailTransactionInfo } from './TradeDetailTransactionInfo';
import { getTradeTitle } from '../../../utils/general/utils';

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
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    useEffect(() => {
        if (isVisible) {
            openModal();
        }
    }, [isVisible, openModal]);

    if (!orderId || !trade) {
        return null;
    }

    const onOpenedWebview = () => {
        closeModal();
    };

    const tradeTitle = getTradeTitle(trade, translate);

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            onDismiss={onDismiss}
            style={applyStyle(bottomSheetStyle)}
            title={tradeTitle}
            isCloseDisplayed
        >
            <TradeDetailHeader orderId={orderId} onOpenedWebview={onOpenedWebview} />
            <TradeDetailTransactionInfo orderId={orderId} />
            <TradeDetailInfo orderId={orderId} />
            <TradeDetailFooter orderId={orderId} />
        </BottomSheetModal>
    );
});
