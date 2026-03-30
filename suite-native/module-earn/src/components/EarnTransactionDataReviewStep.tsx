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

const cardStyle = prepareNativeStyle<{ isFinalStep: boolean }>((utils, { isFinalStep }) => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderElevation1,
    maxWidth: '100%',

    extend: {
        condition: isFinalStep,
        style: {
            backgroundColor: utils.colors.backgroundPrimarySubtleOnElevation1,
            borderColor: utils.colors.backgroundPrimarySubtleOnElevation0,
            ...utils.boxShadows.none,
        },
    },
}));

const getIconProps = (stepNumber: number | undefined): OrderedListIconProps =>
    stepNumber
        ? {
              iconNumber: stepNumber,
              iconBackgroundColor: 'backgroundTertiaryDefaultOnElevation1',
              iconBorderColor: 'borderElevation0',
          }
        : {
              iconName: 'flagCheckered',
              iconBackgroundColor: 'backgroundPrimaryDefault',
              iconColor: 'iconDefaultInverted',
          };

type EarnTransactionDataReviewStepProps = {
    translationId: TxKeyPath;
    stepNumber?: number;
    onLayout?: (event: LayoutChangeEvent) => void;
};

export const EarnTransactionDataReviewStep = ({
    stepNumber,
    translationId,
    onLayout,
}: EarnTransactionDataReviewStepProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View onLayout={onLayout}>
            <Card style={applyStyle(cardStyle, { isFinalStep: !stepNumber })}>
                <HStack spacing="sp12" alignItems="center">
                    <OrderedListIcon {...getIconProps(stepNumber)} />
                    <Box flexShrink={1}>
                        <Text variant="body-sm-strong">
                            <Translation id={translationId} />
                        </Text>
                    </Box>
                </HStack>
            </Card>
        </View>
    );
};
