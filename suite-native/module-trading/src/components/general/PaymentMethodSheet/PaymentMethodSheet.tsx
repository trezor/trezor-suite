import type { BuyTrade, SellFiatTrade } from 'invity-api';

import { BottomSheetFlashList } from '@suite-native/atoms';

import {
    ESTIMATED_HEADER_HEIGHT,
    SimpleSheetHeader,
    type SimpleSheetHeaderProps,
} from '../SimpleSheetHeader';
import { PAYMENT_METHOD_LIST_ITEM_HEIGHT, PaymentMethodListItem } from './PaymentMethodListItem';

export type PaymentMethodsSheetProps<T extends BuyTrade | SellFiatTrade> = {
    quotes: T[];
    isVisible: boolean;
    onClose: () => void;
    onQuoteSelect: (quote: T) => void;
    selectedQuote?: T;
    title: SimpleSheetHeaderProps['title'];
};

const EXTRA_LIST_PADDING = 20;

const keyExtractor = (item: BuyTrade | SellFiatTrade) => item.orderId ?? '';
const getEstimatedListHeight = (itemsCount: number) =>
    itemsCount * PAYMENT_METHOD_LIST_ITEM_HEIGHT + ESTIMATED_HEADER_HEIGHT + EXTRA_LIST_PADDING;

export const PaymentMethodSheet = <T extends BuyTrade | SellFiatTrade>({
    quotes,
    isVisible,
    onClose,
    onQuoteSelect,
    selectedQuote,
    title,
}: PaymentMethodsSheetProps<T>) => {
    const onQuoteSelectCallback = (quote: T) => {
        onQuoteSelect(quote);
        onClose();
    };

    return (
        <BottomSheetFlashList<T>
            isVisible={isVisible}
            onClose={onClose}
            renderItem={({ item, index }) => (
                <PaymentMethodListItem
                    quote={item}
                    onPress={() => onQuoteSelectCallback(item)}
                    isFirst={index === 0}
                    isLast={index === quotes.length - 1}
                />
            )}
            handleComponent={() => <SimpleSheetHeader onClose={onClose} title={title} />}
            data={quotes}
            estimatedListHeight={getEstimatedListHeight(quotes.length)}
            keyExtractor={keyExtractor}
            extraData={selectedQuote?.orderId}
        />
    );
};
