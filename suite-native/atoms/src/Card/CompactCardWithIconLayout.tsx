import { ReactNode } from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Card } from './Card';
import { Box } from '../Box';
import { InlineAlertBox, InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';
import { Loader } from '../Loader';
import { RoundedIcon } from '../RoundedIcon';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';

type CardVariant = 'normal' | 'danger';
export type CompactCardWithIconLayoutProps = {
    icon: IconName;
    title: ReactNode;
    subtitle?: ReactNode;
    isDisabled?: boolean;
    alertBoxProps?: Omit<InlineAlertBoxProps, 'borderRadius'>;
    onPress?: () => void;
    variant?: CardVariant;
    noShadow?: boolean;
    borderColor?: Color | null;
} & TouchableOpacityProps;

type CardColorScheme = {
    iconWrapperBackgroundColor: Color;
    iconColor: Color;
    titleColor: Color;
    subtitleColor: Color;
};

export const cardVariantToColorsMap = {
    normal: {
        iconWrapperBackgroundColor: 'backgroundTertiaryDefaultOnElevation1',
        iconColor: 'iconDefault',
        titleColor: 'textDefault',
        subtitleColor: 'textSubdued',
    },
    danger: {
        iconWrapperBackgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        iconColor: 'iconAlertRed',
        titleColor: 'textAlertRed',
        subtitleColor: 'textAlertRed',
    },
} as const satisfies Record<CardVariant, CardColorScheme>;

const contentStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

export const CompactCardWithIconLayout = ({
    icon,
    title,
    subtitle,
    alertBoxProps,
    onPress,
    isDisabled = false,
    variant = 'normal',
    noShadow = false,
    borderColor = 'borderElevation1',
    ...pressableProps
}: CompactCardWithIconLayoutProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity disabled={isDisabled} onPress={onPress} {...pressableProps}>
            <Card noPadding borderColor={borderColor ?? undefined}>
                <HStack
                    paddingHorizontal="sp16"
                    paddingVertical="sp12"
                    spacing="sp12"
                    alignItems="center"
                >
                    <RoundedIcon
                        backgroundColor={cardVariantToColorsMap[variant].iconWrapperBackgroundColor}
                        color={cardVariantToColorsMap[variant].iconColor}
                        name={icon}
                    />
                    <VStack spacing="sp2" style={applyStyle(contentStyle)}>
                        <Text color={cardVariantToColorsMap[variant].titleColor}>{title}</Text>
                        {subtitle && (
                            <Text
                                color={cardVariantToColorsMap[variant].subtitleColor}
                                variant="hint"
                            >
                                {subtitle}
                            </Text>
                        )}
                    </VStack>
                    {isDisabled ? (
                        <Loader />
                    ) : (
                        <Icon name="caretRight" size="mediumLarge" color="iconSubdued" />
                    )}
                </HStack>
                {alertBoxProps && (
                    <Box margin="sp4">
                        <InlineAlertBox {...alertBoxProps} />
                    </Box>
                )}
            </Card>
        </TouchableOpacity>
    );
};
