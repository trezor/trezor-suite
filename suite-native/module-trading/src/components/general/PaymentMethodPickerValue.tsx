import { type BuyCryptoPaymentMethod, type SellCryptoPaymentMethod } from 'invity-api';

import { Box, HStack, Text } from '@suite-native/atoms';
import { PaymentMethodIcon } from '@suite-native/icons';
import { PaymentMethodTranslation } from '@suite-native/trading-atoms';

type PaymentMethodPickerValueProps = {
    paymentMethod?: SellCryptoPaymentMethod | BuyCryptoPaymentMethod;
    paymentMethodName?: string;
    accessibilityLabel: string;
    testID: string;
};

export const PaymentMethodPickerValue = ({
    paymentMethod,
    paymentMethodName,
    accessibilityLabel,
    testID,
}: PaymentMethodPickerValueProps) => (
    <HStack spacing="sp4" alignItems="center" justifyContent="flex-end" flexShrink={1}>
        <PaymentMethodIcon paymentMethod={paymentMethod} />
        <Box flexShrink={1}>
            <Text
                color="contentPrimary"
                variant="body-sm"
                accessibilityLabel={accessibilityLabel}
                testID={testID}
                numberOfLines={1}
                ellipsizeMode="tail"
            >
                <PaymentMethodTranslation
                    paymentMethod={paymentMethod}
                    paymentMethodName={paymentMethodName}
                />
            </Text>
        </Box>
    </HStack>
);
