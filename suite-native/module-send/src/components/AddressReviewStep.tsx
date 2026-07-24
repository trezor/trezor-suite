import { type ReactNode } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

import {
    Box,
    Card,
    HStack,
    OrderedListIcon,
    type OrderedListIconProps,
    Text,
} from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type AddressReviewStepProps = {
    translationId: TxKeyPath;
    stepNumber?: number;
    rightIcon?: ReactNode;
    onLayout?: (event: LayoutChangeEvent) => void;
};

const getIconProps = (stepNumber: AddressReviewStepProps['stepNumber']): OrderedListIconProps =>
    stepNumber
        ? {
              iconNumber: stepNumber,
              iconBackgroundColor: 'elementFillNeutralSofter',
              iconBorderColor: 'elementBorderNeutralSofter',
          }
        : {
              iconName: 'flagCheckered',
              iconBackgroundColor: 'elementFillBrandBold',
              iconColor: 'contentBrand',
          };

const cardStyle = prepareNativeStyle<{ isFinalStep: boolean }>((utils, { isFinalStep }) => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderNeutral,
    maxWidth: '100%',

    extend: {
        condition: isFinalStep,
        style: {
            backgroundColor: utils.colors.elementFillBrandSofter,
            borderColor: utils.colors.elementBorderBrandSofter,
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
                        <Text variant="body-sm-strong">
                            <Translation id={translationId} />
                        </Text>
                    </Box>
                    {rightIcon}
                </HStack>
            </Card>
        </View>
    );
};
