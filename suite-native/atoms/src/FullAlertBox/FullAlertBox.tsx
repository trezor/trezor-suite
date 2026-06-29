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
        padding: utils.spacings.sp16,
    }),
);

export type FullAlertBoxProps = {
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
    verticalAlignment?: 'flex-start' | 'center';
} & BoxProps;

export const FullAlertBox = ({
    title,
    description,
    primaryButtonLabel,
    onPressPrimaryButton,
    onPressSecondaryButton,
    secondaryButtonLabel,
    primaryButtonProps,
    secondaryButtonProps,
    intent = 'neutral',
    iconName,
    verticalAlignment = 'flex-start',
    ...restProps
}: FullAlertBoxProps) => {
    const { applyStyle } = useNativeStyles();
    const { backgroundColor, borderColor, textColor } = intentToColorMap[intent];

    return (
        <Box style={applyStyle(containerStyle, { backgroundColor, borderColor })} {...restProps}>
            <VStack spacing="sp12">
                <HStack spacing="sp12" alignItems={verticalAlignment}>
                    <Icon
                        name={iconName ?? intentToIconName[intent]}
                        color={textColor}
                        size="large"
                    />
                    <VStack spacing="sp12" flex={1}>
                        <VStack spacing="sp2">
                            <Text color={textColor}>{title}</Text>
                            {description && (
                                <Text color={textColor} priority="secondary" variant="body-sm">
                                    {description}
                                </Text>
                            )}
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
