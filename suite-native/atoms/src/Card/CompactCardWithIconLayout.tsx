import { ReactNode } from 'react';
import { Pressable, PressableProps } from 'react-native';
import { useSelector } from 'react-redux';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Card } from './Card';
import { Box } from '../Box';
import { InlineAlertBox, InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';
import { Loader } from '../Loader';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';

const ICON_WRAPPER_SIZE = 48;

type CardVariant = 'normal' | 'danger';
type CompactCardWithIconLayoutProps = Omit<PressableProps, 'onPress'> & {
    icon: IconName;
    title: ReactNode;
    subtitle: ReactNode;
    alertBoxProps?: Omit<InlineAlertBoxProps, 'borderRadius'>;
    onPress?: () => void;
    variant?: CardVariant;
};

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

const iconWrapperStyle = prepareNativeStyle<{ variant: CardVariant }>((utils, { variant }) => ({
    alignItems: 'center',
    justifyContent: 'center',
    width: ICON_WRAPPER_SIZE,
    height: ICON_WRAPPER_SIZE,
    backgroundColor: utils.colors[cardVariantToColorsMap[variant].iconWrapperBackgroundColor],
    borderRadius: utils.borders.radii.round,
}));

export const CompactCardWithIconLayout = ({
    icon,
    title,
    subtitle,
    alertBoxProps,
    onPress,
    variant = 'normal',
    ...pressableProps
}: CompactCardWithIconLayoutProps) => {
    const { applyStyle } = useNativeStyles();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    return (
        <Pressable onPress={onPress} disabled={isDiscoveryRunning} {...pressableProps}>
            <Card borderColor="borderElevation1" noPadding>
                <HStack padding="sp16" spacing="sp12" alignItems="center">
                    <Box style={applyStyle(iconWrapperStyle, { variant })}>
                        <Icon
                            name={icon}
                            size="large"
                            color={cardVariantToColorsMap[variant].iconColor}
                        />
                    </Box>
                    <VStack spacing="sp2" style={applyStyle(contentStyle)}>
                        <Text color={cardVariantToColorsMap[variant].titleColor}>{title}</Text>
                        <Text color={cardVariantToColorsMap[variant].subtitleColor} variant="hint">
                            {subtitle}
                        </Text>
                    </VStack>
                    {isDiscoveryRunning ? (
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
        </Pressable>
    );
};
