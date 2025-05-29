import type { BuyTrade } from 'invity-api';

import { BottomSheetFlashList } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { ESTIMATED_HEADER_HEIGHT, SimpleSheetHeader } from '../SimpleSheetHeader';
import { PAYMENT_METHOD_LIST_ITEM_HEIGHT, PaymentMethodListItem } from './PaymentMethodListItem';

export type PaymentMethodsSheetProps = {
    quotes: BuyTrade[];
    isVisible: boolean;
    onClose: () => void;
    onQuoteSelect: (quote: BuyTrade) => void;
    selectedQuote?: BuyTrade;
};

const EXTRA_LIST_PADDING = 20;

const keyExtractor = (item: BuyTrade) => item.orderId ?? '';
const getEstimatedListHeight = (itemsCount: number) =>
    itemsCount * PAYMENT_METHOD_LIST_ITEM_HEIGHT + ESTIMATED_HEADER_HEIGHT + EXTRA_LIST_PADDING;

export const PaymentMethodSheet = ({
    quotes,
    isVisible,
    onClose,
    onQuoteSelect,
    selectedQuote,
}: PaymentMethodsSheetProps) => {
    const { translate } = useTranslate();
    const onQuoteSelectCallback = (quote: BuyTrade) => {
        onQuoteSelect(quote);
        onClose();
    };

    return (
        <BottomSheetFlashList<BuyTrade>
            isVisible={isVisible}
            onClose={onClose}
            renderItem={({ item }) => (
                <PaymentMethodListItem
                    orderId={item.orderId ?? ''}
                    paymentMethodName={item.paymentMethodName ?? ''}
                    onPress={() => onQuoteSelectCallback(item)}
                    isSelected={item.orderId === selectedQuote?.orderId}
                />
            )}
            handleComponent={() => (
                <SimpleSheetHeader
                    onClose={onClose}
                    title={translate('moduleTrading.tradingScreen.paymentMethod')}
                />
            )}
            data={quotes}
            estimatedListHeight={getEstimatedListHeight(quotes.length)}
            estimatedItemSize={PAYMENT_METHOD_LIST_ITEM_HEIGHT}
            keyExtractor={keyExtractor}
            extraData={selectedQuote?.orderId}
        />
    );
};
