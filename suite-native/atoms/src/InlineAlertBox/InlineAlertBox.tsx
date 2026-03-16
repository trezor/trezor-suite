import { type ReactNode } from 'react';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type BoxProps } from '../Box';
import { Button, type ButtonProps } from '../Button/Button';
import { HStack } from '../Stack';
import { Text } from '../Text';
import {
    type InlineAlertBoxStyles,
    type InlineAlertBoxVariant,
    variantToColorMap,
    variantToIconName,
} from './presets';

const alertWrapperStyle = prepareNativeStyle<
    Omit<InlineAlertBoxStyles, 'buttonColorProps'> & { isButtonVisible: boolean }
>((utils, { borderColor, backgroundColor, isButtonVisible }) => ({
    alignItems: 'center',
    borderRadius: utils.borders.radii.r12,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors[borderColor],
    backgroundColor: utils.colors[backgroundColor],
    paddingVertical: isButtonVisible ? utils.spacings.sp8 : utils.spacings.sp10,
    paddingRight: isButtonVisible ? utils.spacings.sp8 : utils.spacings.sp16,
    paddingLeft: utils.spacings.sp16,
}));

const textStyle = prepareNativeStyle(utils => ({
    flex: 1,
    paddingTop: utils.spacings.sp2,
}));

export type InlineAlertBoxProps = Omit<BoxProps, 'style'> & {
    title: Exclude<ReactNode, null | undefined>;
    variant?: InlineAlertBoxVariant;
    buttonLabel?: ReactNode;
    onButtonPress?: () => void;
    iconName?: IconName;
    viewLeft?: ReactNode;
    buttonProps?: Partial<ButtonProps>;
};

export const InlineAlertBox = ({
    title,
    buttonLabel,
    onButtonPress,
    iconName,
    buttonProps,
    viewLeft,
    variant = 'neutral',
    ...props
}: InlineAlertBoxProps) => {
    const { applyStyle } = useNativeStyles();
    const { backgroundColor, borderColor, buttonColorProps } = variantToColorMap[variant];

    return (
        <HStack
            style={applyStyle(alertWrapperStyle, {
                borderColor,
                backgroundColor,
                isButtonVisible: Boolean(buttonLabel),
            })}
            {...props}
        >
            {viewLeft ? (
                viewLeft
            ) : (
                <Icon name={iconName || variantToIconName[variant]} size="mediumLarge" />
            )}
            <Text variant="body-sm" style={applyStyle(textStyle)}>
                {title}
            </Text>
            {buttonLabel && (
                <Button size="small" {...buttonColorProps} onPress={onButtonPress} {...buttonProps}>
                    {buttonLabel}
                </Button>
            )}
        </HStack>
    );
};
