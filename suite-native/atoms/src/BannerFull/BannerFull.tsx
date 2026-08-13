import { type PropsWithChildren } from 'react';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box, type BoxProps } from '../Box';
import { Button, type ButtonProps } from '../Button/Button';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';
import { type AlertBoxStyles, intentToColorMap, intentToIconName } from './presets';
import { type AlertBoxIntent } from './types';

const containerStyle = prepareNativeStyle<Pick<AlertBoxStyles, 'backgroundColor' | 'borderColor'>>(
    (utils, { backgroundColor, borderColor }) => ({
        backgroundColor: utils.colors[backgroundColor],
        borderWidth: utils.borders.widths.small,
        borderColor: utils.colors[borderColor],
        borderRadius: utils.borders.radii.r12,
        padding: utils.spacings.sp12,
    }),
);

export type BannerFullProps = {
    title: React.ReactNode;
    description?: React.ReactNode;
    primaryButtonLabel?: string | React.ReactNode;
    secondaryButtonLabel?: string | React.ReactNode;
    onPressPrimaryButton?: () => void;
    onPressSecondaryButton?: () => void;
    primaryButtonProps?: Partial<ButtonProps>;
    secondaryButtonProps?: Partial<ButtonProps>;
    intent?: AlertBoxIntent;
    iconName?: IconName;
} & BoxProps;

export const BannerFull = ({
    title,
    description,
    children,
    primaryButtonLabel,
    onPressPrimaryButton,
    onPressSecondaryButton,
    secondaryButtonLabel,
    primaryButtonProps,
    secondaryButtonProps,
    intent = 'neutral',
    iconName,
    ...restProps
}: PropsWithChildren<BannerFullProps>) => {
    const { applyStyle } = useNativeStyles();
    const { backgroundColor, borderColor, textColor } = intentToColorMap[intent];

    return (
        <Box style={applyStyle(containerStyle, { backgroundColor, borderColor })} {...restProps}>
            <VStack spacing="sp12">
                <HStack spacing="sp12" alignItems="flex-start">
                    <Box paddingTop="sp1">
                        <Icon
                            name={iconName ?? intentToIconName[intent]}
                            color={textColor}
                            size="mediumLarge"
                        />
                    </Box>
                    <VStack spacing="sp12" flex={1}>
                        <VStack spacing="sp2">
                            <Text color={textColor}>{title}</Text>
                            {description && (
                                <Text color={textColor} variant="body-sm">
                                    {description}
                                </Text>
                            )}
                            {children}
                        </VStack>
                    </VStack>
                </HStack>
                {primaryButtonLabel && (
                    <HStack spacing="sp12" paddingLeft="sp32">
                        {secondaryButtonLabel && (
                            <Button
                                size="medium"
                                intent={intent}
                                priority="secondary"
                                flex={1}
                                onPress={onPressSecondaryButton}
                                {...secondaryButtonProps}
                            >
                                {secondaryButtonLabel}
                            </Button>
                        )}
                        <Button
                            size="medium"
                            intent={intent}
                            priority="primary"
                            flex={1}
                            onPress={onPressPrimaryButton}
                            {...primaryButtonProps}
                        >
                            {primaryButtonLabel}
                        </Button>
                    </HStack>
                )}
            </VStack>
        </Box>
    );
};
