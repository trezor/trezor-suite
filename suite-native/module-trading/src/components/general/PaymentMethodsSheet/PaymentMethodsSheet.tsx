import { TradingPaymentMethodListProps } from '@suite-common/trading';
import { BottomSheetFlashList } from '@suite-native/atoms';

import { PAYMENT_METHOD_LIST_ITEM_HEIGHT, PaymentMethodListItem } from './PaymentMethodListItem';

export type PaymentMethodsSheetProps = {
    methods: TradingPaymentMethodListProps[];
    isVisible: boolean;
    onClose: () => void;
    onMethodSelect: (method: TradingPaymentMethodListProps) => void;
    selectedMethod?: TradingPaymentMethodListProps;
};

const keyExtractor = (item: TradingPaymentMethodListProps) => item.value;
const getEstimatedListHeight = (itemsCount: number) => itemsCount * PAYMENT_METHOD_LIST_ITEM_HEIGHT;

export const PaymentMethodsSheet = ({
    methods,
    isVisible,
    onClose,
    onMethodSelect,
    selectedMethod,
}: PaymentMethodsSheetProps) => {
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
            data={methods}
            estimatedListHeight={getEstimatedListHeight(methods.length)}
            estimatedItemSize={PAYMENT_METHOD_LIST_ITEM_HEIGHT}
            keyExtractor={keyExtractor}
        />
    );
};
