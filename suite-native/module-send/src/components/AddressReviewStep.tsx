import { ReactNode } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import {
    OrderedListIconProps,
    Card,
    Text,
    HStack,
    OrderedListIcon,
    Box,
} from '@suite-native/atoms';
import { TxKeyPath, Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type AddressReviewStepProps = {
    translationId: TxKeyPath;
    stepNumber?: number;
    rightIcon?: ReactNode;
    onLayout?: (event: LayoutChangeEvent) => void;
};

const getIconProps = (stepNumber: AddressReviewStepProps['stepNumber']): OrderedListIconProps => {
    return stepNumber
        ? {
              iconNumber: stepNumber,
              iconBackgroundColor: 'backgroundTertiaryDefaultOnElevation0',
              iconBorderColor: 'borderElevation0',
          }
        : {
              iconBackgroundColor: 'backgroundPrimaryDefault',
              iconNumber: undefined,
              iconName: 'flagFinish',
              iconColor: 'iconDefaultInverted',
              iconSize: 'medium',
          };
};

const cardStyle = prepareNativeStyle<{ isFinalStep: boolean }>((utils, { isFinalStep }) => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderElevation1,
    maxWidth: '100%',

    extend: {
        condition: isFinalStep,
        style: {
            backgroundColor: utils.colors.backgroundPrimarySubtleOnElevation0,
            borderColor: utils.colors.backgroundPrimarySubtleOnElevationNegative,
            ...utils.boxShadows.none,
        },
    },
}));

export const AddressReviewStep = ({
    stepNumber,
    translationId,
    rightIcon,
    onLayout,
}: AddressReviewStepProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View onLayout={onLayout}>
            <Card style={applyStyle(cardStyle, { isFinalStep: !stepNumber })}>
                <HStack spacing="sp12" flexDirection="row" alignItems="center">
                    <OrderedListIcon {...getIconProps(stepNumber)} />
                    <Box flexShrink={1}>
                        <Text variant="callout">
                            <Translation id={translationId} />
                        </Text>
                    </Box>
                    {rightIcon}
                </HStack>
            </Card>
        </View>
    );
};
