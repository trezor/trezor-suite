import { type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { Box } from '../Box';
import { InlineAlertBox, type InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';
import { Loader } from '../Loader';
import { RoundedIcon } from '../RoundedIcon';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';
import { useTapGesture } from '../useTapGesture';
import { AnimatedContainerCard, type CardProps } from './Card';

export const COMPACT_CARD_VARIANTS = ['normal', 'danger', 'primary'] as const;
type CompactCardVariant = (typeof COMPACT_CARD_VARIANTS)[number];

export type CompactCardWithIconLayoutProps = {
    icon: IconName;
    title: ReactNode;
    subtitle?: ReactNode;
    isDisabled?: boolean;
    alertBoxProps?: Omit<InlineAlertBoxProps, 'borderRadius'>;
    onPress: () => void;
    variant?: CompactCardVariant;
    borderColor?: Color | null;
} & Omit<CardProps, 'children' | 'borderColor'>;

type CardColorScheme = {
    iconWrapperBackgroundColor: Color;
    iconColor: Color;
    titleColor: Color;
    subtitleColor: Color;
    caretColor: Color;
};

export const cardVariantToColorsMap = {
    normal: {
        iconWrapperBackgroundColor: 'legacyBackgroundTertiaryDefaultOnElevation1',
        iconColor: 'contentPrimary',
        titleColor: 'contentPrimary',
        subtitleColor: 'contentSecondary',
        caretColor: 'contentSecondary',
    },
    danger: {
        iconWrapperBackgroundColor: 'legacyBackgroundAlertRedSubtleOnElevation1',
        iconColor: 'contentCritical',
        titleColor: 'contentCritical',
        subtitleColor: 'contentCritical',
        caretColor: 'contentSecondary',
    },
    primary: {
        iconWrapperBackgroundColor: 'legacyBackgroundPrimarySubtleOnElevation0',
        iconColor: 'contentBrand',
        titleColor: 'contentBrand',
        subtitleColor: 'contentBrand',
        caretColor: 'contentBrand',
    },
} as const satisfies Record<CompactCardVariant, CardColorScheme>;

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
    noShadow,
    testID,
    isDisabled = false,
    variant = 'normal',
    borderColor = 'borderNeutral',
    ...cardProps
}: CompactCardWithIconLayoutProps) => {
    const { applyStyle } = useNativeStyles();
    const { caretColor, iconColor, titleColor, subtitleColor, iconWrapperBackgroundColor } =
        cardVariantToColorsMap[variant];

    const { tapGesture, animatedStyle } = useTapGesture({ onPress, isDisabled });

    return (
        <GestureDetector gesture={tapGesture}>
            <View collapsable={false} testID={testID}>
                <AnimatedContainerCard
                    noPadding
                    borderColor={borderColor ?? undefined}
                    animatedStyle={animatedStyle}
                    // Android shadow does not work well with the Reanimated opacity animation.
                    noShadow={Platform.OS === 'android' ? true : noShadow}
                    {...cardProps}
                >
                    <HStack
                        paddingHorizontal="sp16"
                        paddingVertical="sp12"
                        spacing="sp12"
                        alignItems="center"
                    >
                        <RoundedIcon
                            backgroundColor={iconWrapperBackgroundColor}
                            color={iconColor}
                            name={icon}
                        />
                        <VStack spacing="sp2" style={applyStyle(contentStyle)}>
                            <Text color={titleColor}>{title}</Text>
                            {subtitle && (
                                <Text color={subtitleColor} variant="body-sm">
                                    {subtitle}
                                </Text>
                            )}
                        </VStack>
                        {isDisabled ? (
                            <Loader />
                        ) : (
                            <Icon name="caretRight" size="mediumLarge" color={caretColor} />
                        )}
                    </HStack>
                    {alertBoxProps && (
                        <Box margin="sp4">
                            <InlineAlertBox {...alertBoxProps} />
                        </Box>
                    )}
                </AnimatedContainerCard>
            </View>
        </GestureDetector>
    );
};
