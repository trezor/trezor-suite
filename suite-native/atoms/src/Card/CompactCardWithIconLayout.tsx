import { type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color, type NativeSpacing } from '@trezor/theme';

import { BannerInline, type BannerInlineProps } from '../BannerInline/BannerInline';
import { Box } from '../Box';
import { IconCircle, type IconCircleIntent, type IconCircleSize } from '../Icon/IconCircle';
import { Loader } from '../Loader';
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
    alertBoxProps?: BannerInlineProps;
    /** Diameter of the {@linkcode IconCircle} background. Defaults to 48. */
    iconSize?: IconCircleSize;
    /** Horizontal content inset. Defaults to 16. */
    paddingHorizontal?: NativeSpacing;
    /** Vertical content inset. Defaults to 12. */
    paddingVertical?: NativeSpacing;
    onPress: () => void;
    variant?: CompactCardVariant;
    borderColor?: Color | null;
} & Omit<CardProps, 'children' | 'borderColor'>;

type CardColorScheme = {
    iconIntent: IconCircleIntent;
    titleColor: Color;
    subtitleColor: Color;
    caretColor: Color;
};

export const cardVariantToColorsMap = {
    normal: {
        iconIntent: 'neutral',
        titleColor: 'contentPrimary',
        subtitleColor: 'contentSecondary',
        caretColor: 'contentSecondary',
    },
    danger: {
        iconIntent: 'critical',
        titleColor: 'contentCritical',
        subtitleColor: 'contentCritical',
        caretColor: 'contentSecondary',
    },
    primary: {
        iconIntent: 'brand',
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
    iconSize,
    paddingHorizontal = 'sp16',
    paddingVertical = 'sp12',
    onPress,
    noShadow,
    testID,
    isDisabled = false,
    variant = 'normal',
    borderColor = 'borderNeutral',
    ...cardProps
}: CompactCardWithIconLayoutProps) => {
    const { applyStyle } = useNativeStyles();
    const { caretColor, iconIntent, titleColor, subtitleColor } = cardVariantToColorsMap[variant];

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
                        paddingHorizontal={paddingHorizontal}
                        paddingVertical={paddingVertical}
                        spacing="sp12"
                        alignItems="center"
                    >
                        <IconCircle intent={iconIntent} name={icon} size={iconSize} />
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
                            <BannerInline {...alertBoxProps} />
                        </Box>
                    )}
                </AnimatedContainerCard>
            </View>
        </GestureDetector>
    );
};
