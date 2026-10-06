import { Box, type BoxProps, HStack, Text } from '@suite-native/atoms';
import { PaymentMethodIcon } from '@suite-native/icons';
import { type NativeSpacing } from '@trezor/theme';

import {
    PaymentMethodTranslation,
    type PaymentMethodTranslationProps,
} from './PaymentMethodTranslation';

export type PaymentMethodDisplayProps = PaymentMethodTranslationProps &
    BoxProps & {
        accessibilityLabel?: string;
        iconSize?: number;
        spacing?: NativeSpacing | number;
        testID?: string;
    };

export const PaymentMethodDisplay = ({
    accessibilityLabel,
    iconSize = 20,
    justifyContent = 'flex-end',
    paymentMethod,
    paymentMethodName,
    spacing = 'sp4',
    testID,
    ...boxProps
}: PaymentMethodDisplayProps) => (
    <HStack
        alignItems="center"
        flexShrink={1}
        justifyContent={justifyContent}
        spacing={spacing}
        {...boxProps}
    >
        <PaymentMethodIcon paymentMethod={paymentMethod} size={iconSize} />
        <Box flexShrink={1}>
            <Text
                accessibilityLabel={accessibilityLabel}
                color="contentPrimary"
                ellipsizeMode="tail"
                numberOfLines={1}
                testID={testID}
                variant="body-sm"
            >
                <PaymentMethodTranslation
                    paymentMethod={paymentMethod}
                    paymentMethodName={paymentMethodName}
                />
            </Text>
        </Box>
    </HStack>
);
