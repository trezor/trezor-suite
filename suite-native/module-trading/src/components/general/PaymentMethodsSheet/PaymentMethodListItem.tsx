import { Pressable } from 'react-native';

import { TradingPaymentMethodListProps } from '@suite-common/trading';
import { Card, HStack, Radio, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type PaymentMethodListItemProps = {
    method: TradingPaymentMethodListProps;
    isSelected: boolean;
    onPress: () => void;
};

export const PAYMENT_METHOD_LIST_ITEM_HEIGHT = 66 as const;

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    marginVertical: spacings.sp4,
}));

export const PaymentMethodListItem = ({
    onPress,
    method,
    isSelected,
}: PaymentMethodListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress} style={applyStyle(wrapperStyle)}>
            <Card>
                <HStack alignItems="center" justifyContent="space-between">
                    <Text variant="body" color="textDefault">
                        {method.label}
                    </Text>
                    <Radio value={method.value} onPress={onPress} isChecked={isSelected} />
                </HStack>
            </Card>
        </Pressable>
    );
};
