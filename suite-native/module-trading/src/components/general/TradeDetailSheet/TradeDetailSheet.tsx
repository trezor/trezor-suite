import { memo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { type BottomSheetModal as BottomSheetModalType } from '@gorhom/bottom-sheet';

import { TradingRootState, selectTradingTradeByOrderId } from '@suite-common/trading';
import { BottomSheetModal } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TradeDetailFooter } from './TradeDetailFooter';
import { TradeDetailHeader } from './TradeDetailHeader';
import { TradeDetailInfo } from './TradeDetailInfo';
import { TradeDetailTransactionInfo } from './TradeDetailTransactionInfo';

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
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    const bottomSheetModalRef = useRef<BottomSheetModalType>(null);

    useEffect(() => {
        if (isVisible) {
            bottomSheetModalRef.current?.present();
        }
    }, [isVisible]);

    if (!orderId || !trade) {
        return null;
    }

    const onOpenedWebview = () => {
        bottomSheetModalRef.current?.close();
    };

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            onDismiss={onDismiss}
            style={applyStyle(bottomSheetStyle)}
            isCloseDisplayed
        >
            <TradeDetailHeader orderId={orderId} onOpenedWebview={onOpenedWebview} />
            <TradeDetailTransactionInfo orderId={orderId} />
            <TradeDetailInfo orderId={orderId} />
            <TradeDetailFooter orderId={orderId} />
        </BottomSheetModal>
    );
});
