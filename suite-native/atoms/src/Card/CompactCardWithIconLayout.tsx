import { ReactNode } from 'react';
import { PressableProps } from 'react-native';

import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box } from '../Box';
import { InlineAlertBox, InlineAlertBoxProps } from '../InlineAlertBox/InlineAlertBox';
import { Loader } from '../Loader';
import { PressableOpacity } from '../Pressable';
import { RoundedIcon } from '../RoundedIcon';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';
import { Card } from './Card';

export const COMPACT_CARD_VARIANTS = ['normal', 'danger', 'primary'] as const;
type CompactCardVariant = (typeof COMPACT_CARD_VARIANTS)[number];

export type CompactCardWithIconLayoutProps = {
    icon: IconName;
    title: ReactNode;
    subtitle?: ReactNode;
    isDisabled?: boolean;
    alertBoxProps?: Omit<InlineAlertBoxProps, 'borderRadius'>;
    onPress?: () => void;
    variant?: CompactCardVariant;
    noShadow?: boolean;
    borderColor?: Color | null;
} & PressableProps;

type CardColorScheme = {
    iconWrapperBackgroundColor: Color;
    iconColor: Color;
    titleColor: Color;
    subtitleColor: Color;
    caretColor: Color;
};

export const cardVariantToColorsMap = {
    normal: {
        iconWrapperBackgroundColor: 'backgroundTertiaryDefaultOnElevation1',
        iconColor: 'iconDefault',
        titleColor: 'textDefault',
        subtitleColor: 'textSubdued',
        caretColor: 'iconSubdued',
    },
    danger: {
        iconWrapperBackgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        iconColor: 'iconAlertRed',
        titleColor: 'textAlertRed',
        subtitleColor: 'textAlertRed',
        caretColor: 'iconSubdued',
    },
    primary: {
        iconWrapperBackgroundColor: 'backgroundPrimarySubtleOnElevation0',
        iconColor: 'iconPrimaryDefault',
        titleColor: 'textSecondaryHighlight',
        subtitleColor: 'textSecondaryHighlight',
        caretColor: 'iconPrimaryDefault',
    },
} as const satisfies Record<CompactCardVariant, CardColorScheme>;

const contentStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
    flexShrink: 1,
}));

const touchableOpacityStyle = prepareNativeStyle<Pick<CompactCardWithIconLayoutProps, 'noShadow'>>(
    (utils, { noShadow }) => ({
        ...(noShadow ? {} : utils.boxShadows.small),
    }),
);

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

    const { caretColor, iconColor, titleColor, subtitleColor, iconWrapperBackgroundColor } =
        cardVariantToColorsMap[variant];

    return (
        <PressableOpacity
            style={applyStyle(touchableOpacityStyle, { noShadow })}
            disabled={isDisabled}
            onPress={onPress}
            {...pressableProps}
        >
            <Card noPadding noShadow borderColor={borderColor ?? undefined}>
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
                            <Text color={subtitleColor} variant="hint">
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
            </Card>
        </PressableOpacity>
    );
};
