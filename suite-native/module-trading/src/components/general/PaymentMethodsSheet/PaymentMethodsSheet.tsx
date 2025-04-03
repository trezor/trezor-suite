import { TradingPaymentMethodListProps } from '@suite-common/trading';
import { BottomSheetFlashList } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { ESTIMATED_HEADER_HEIGHT, SimpleSheetHeader } from '../SimpleSheetHeader';
import { PAYMENT_METHOD_LIST_ITEM_HEIGHT, PaymentMethodListItem } from './PaymentMethodListItem';

export type PaymentMethodsSheetProps = {
    methods: TradingPaymentMethodListProps[];
    isVisible: boolean;
    onClose: () => void;
    onMethodSelect: (method: TradingPaymentMethodListProps) => void;
    selectedMethod?: TradingPaymentMethodListProps;
};

const EXTRA_LIST_PADDING = 20;

const keyExtractor = (item: TradingPaymentMethodListProps) => item.value;
const getEstimatedListHeight = (itemsCount: number) =>
    itemsCount * PAYMENT_METHOD_LIST_ITEM_HEIGHT + ESTIMATED_HEADER_HEIGHT + EXTRA_LIST_PADDING;

export const PaymentMethodsSheet = ({
    methods,
    isVisible,
    onClose,
    onMethodSelect,
    selectedMethod,
}: PaymentMethodsSheetProps) => {
    const { translate } = useTranslate();
    const onMethodSelectCallback = (method: TradingPaymentMethodListProps) => {
        onMethodSelect(method);
        onClose();
    };

    return (
        <BottomSheetFlashList<TradingPaymentMethodListProps>
            isVisible={isVisible}
            onClose={onClose}
            renderItem={({ item }) => (
                <PaymentMethodListItem
                    method={item}
                    onPress={() => onMethodSelectCallback(item)}
                    isSelected={item.value === selectedMethod?.value}
                />
            )}
            handleComponent={() => (
                <SimpleSheetHeader
                    onClose={onClose}
                    title={translate('moduleTrading.tradingScreen.paymentMethod')}
                />
            )}
            data={methods}
            estimatedListHeight={getEstimatedListHeight(methods.length)}
            estimatedItemSize={PAYMENT_METHOD_LIST_ITEM_HEIGHT}
            keyExtractor={keyExtractor}
        />
    );
};
