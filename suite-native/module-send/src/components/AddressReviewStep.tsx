import { type ReactNode } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

import { Box, Card, HStack, IconSquare, type IconSquareProps, Text } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type AddressReviewStepProps = {
    translationId: TxKeyPath;
    stepNumber?: number;
    rightIcon?: ReactNode;
    onLayout?: (event: LayoutChangeEvent) => void;
};

const getIconProps = (stepNumber: AddressReviewStepProps['stepNumber']): IconSquareProps =>
    stepNumber
        ? { iconNumber: stepNumber, intent: 'neutral' }
        : { iconName: 'flagCheckered', intent: 'brand' };

const cardStyle = prepareNativeStyle(utils => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderNeutral,
    maxWidth: '100%',
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
            <Card style={applyStyle(cardStyle)}>
                <HStack spacing="sp12" flexDirection="row" alignItems="center">
                    <IconSquare {...getIconProps(stepNumber)} />
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
