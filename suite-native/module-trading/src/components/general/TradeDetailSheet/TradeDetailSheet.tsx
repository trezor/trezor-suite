import { useSelector } from 'react-redux';

import { TradingRootState, selectTradingTradeByOrderId } from '@suite-common/trading';
import { BottomSheet } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TradeDetailFooter } from './TradeDetailFooter';
import { TradeDetailHeader } from './TradeDetailHeader';
import { TradeDetailInfo } from './TradeDetailInfo';
import { TradeDetailTransactionInfo } from './TradeDetailTransactionInfo';

type TradeDetailSheetProps = {
    orderId?: string;
    isVisible: boolean;
    onClose: () => void;
};

const bottomSheetStyle = prepareNativeStyle(({ spacings }) => ({
    gap: spacings.sp16,
}));

export const TradeDetailSheet = ({ orderId, isVisible, onClose }: TradeDetailSheetProps) => {
    const { applyStyle } = useNativeStyles();
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );

    if (!orderId || !trade) {
        return null;
    }

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} style={applyStyle(bottomSheetStyle)}>
            <TradeDetailHeader orderId={orderId} />
            <TradeDetailTransactionInfo orderId={orderId} />
            <TradeDetailInfo orderId={orderId} />
            <TradeDetailFooter orderId={orderId} onOpenedWebview={onClose} />
        </BottomSheet>
    );
};
