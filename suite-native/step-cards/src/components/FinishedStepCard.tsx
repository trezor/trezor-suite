import { type ReactNode } from 'react';

import { Card, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export const cardStyle = prepareNativeStyle(utils => ({
    backgroundColor: 'transparent',
    borderColor: utils.colors.borderNeutral,
    borderWidth: utils.borders.widths.small,
    paddingVertical: utils.spacings.sp12,
}));

export type FinishedStepCardProps = {
    title: ReactNode;
};

export const FinishedStepCard = ({ title }: FinishedStepCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card noShadow style={applyStyle(cardStyle)} testID="@step-cards/finished">
            <HStack spacing="sp8" alignItems="center">
                <Icon name="checkCircleFilled" color="contentBrand" size="mediumLarge" />
                <Text variant="body-md" color="contentBrand">
                    {title}
                </Text>
            </HStack>
        </Card>
    );
};
