import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Button } from '../Button/Button';
import { HStack, VStack } from '../Stack';
import { Text } from '../Text';
import { variantToColorMap, variantToIconName } from './presets';
import { FullAlertProps, FullAlertStyles } from './types';

const containerStyle = prepareNativeStyle<Pick<FullAlertStyles, 'backgroundColor' | 'borderColor'>>(
    (utils, { backgroundColor, borderColor }) => ({
        backgroundColor: utils.colors[backgroundColor],
        borderWidth: utils.borders.widths.small,
        borderColor: utils.colors[borderColor],
        borderRadius: utils.borders.radii.r12,
        padding: utils.spacings.sp16,
    }),
);

export const FullAlertBox = ({
    variant = 'neutral',
    title,
    description,
    primaryButtonLabel,
    onPressPrimaryButton,
    onPressSecondaryButton,
    secondaryButtonLabel,
    primaryButtonProps,
    secondaryButtonProps,
    ...restProps
}: FullAlertProps) => {
    const { applyStyle } = useNativeStyles();
    const { backgroundColor, borderColor, primaryButtonColorScheme, secondaryButtonColorScheme } =
        variantToColorMap[variant];

    return (
        <Box style={applyStyle(containerStyle, { backgroundColor, borderColor })} {...restProps}>
            <HStack spacing="sp12" alignItems="flex-start">
                <Box>
                    <Icon name={variantToIconName[variant]} size="large" />
                </Box>
                <VStack spacing={0} flex={1}>
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
                </VStack>
            </HStack>
        </Box>
    );
};
