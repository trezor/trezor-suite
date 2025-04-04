import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box, BoxProps } from '../Box';
import { Button, ButtonProps } from '../Button/Button';
import { HStack } from '../Stack';
import { Text } from '../Text';
import { AlertVariant, FullAlertStyles, variantToColorMap, variantToIconName } from './presets';

const containerStyle = prepareNativeStyle<Pick<FullAlertStyles, 'backgroundColor' | 'borderColor'>>(
    (utils, { backgroundColor, borderColor }) => ({
        backgroundColor: utils.colors[backgroundColor],
        borderWidth: utils.borders.widths.small,
        borderColor: utils.colors[borderColor],
        borderRadius: utils.borders.radii.r12,
        padding: utils.spacings.sp16,
    }),
);

export type FullAlertBoxProps = {
    title: string;
    description?: string;
    primaryButtonLabel?: string;
    secondaryButtonLabel?: string;
    onPressPrimaryButton?: () => void;
    onPressSecondaryButton?: () => void;
    primaryButtonProps?: Partial<ButtonProps>;
    secondaryButtonProps?: Partial<ButtonProps>;
    variant?: AlertVariant;
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
    variant = 'neutral',
    ...restProps
}: FullAlertBoxProps) => {
    const { applyStyle } = useNativeStyles();
    const { backgroundColor, borderColor, primaryButtonColorScheme, secondaryButtonColorScheme } =
        variantToColorMap[variant];

    return (
        <Box style={applyStyle(containerStyle, { backgroundColor, borderColor })} {...restProps}>
            <HStack spacing="sp12" alignItems="flex-start">
                <Box>
                    <Icon name={variantToIconName[variant]} size="large" />
                </Box>
                <Box flex={1}>
                    <Text>{title}</Text>
                    {description && (
                        <Text color="textSubdued" variant="hint">
                            {description}
                        </Text>
                    )}
                    {primaryButtonLabel && (
                        <HStack marginTop="sp12">
                            {secondaryButtonLabel && (
                                <Button
                                    size="small"
                                    colorScheme={secondaryButtonColorScheme}
                                    flex={1}
                                    onPress={onPressSecondaryButton}
                                    {...secondaryButtonProps}
                                >
                                    {secondaryButtonLabel}
                                </Button>
                            )}
                            <Button
                                size="small"
                                colorScheme={primaryButtonColorScheme}
                                flex={1}
                                onPress={onPressPrimaryButton}
                                {...primaryButtonProps}
                            >
                                {primaryButtonLabel}
                            </Button>
                        </HStack>
                    )}
                </Box>
            </HStack>
        </Box>
    );
};
