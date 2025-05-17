import { Pressable } from 'react-native';

import { Card, HStack, Radio, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type PaymentMethodListItemProps = {
    orderId: string;
    paymentMethodName: string;
    isSelected: boolean;
    onPress: () => void;
};

export const PAYMENT_METHOD_LIST_ITEM_HEIGHT = 66 as const;

const wrapperStyle = prepareNativeStyle(({ spacings }) => ({
    marginVertical: spacings.sp4,
}));

export const PaymentMethodListItem = ({
    onPress,
    orderId,
    paymentMethodName,
    isSelected,
}: PaymentMethodListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress} style={applyStyle(wrapperStyle)}>
            <Card>
                <HStack alignItems="center" justifyContent="space-between">
                    <Text variant="body" color="textDefault">
                        {paymentMethodName}
                    </Text>
                    <Radio value={orderId} onPress={onPress} isChecked={isSelected} />
                </HStack>
            </Card>
        </Pressable>
    );
};
