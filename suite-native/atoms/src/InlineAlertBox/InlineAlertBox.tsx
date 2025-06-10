import { ReactNode } from 'react';

import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { BoxProps } from '../Box';
import { Text } from '../Text';
import {
    InlineAlertBoxStyles,
    InlineAlertBoxVariant,
    variantToColorMap,
    variantToIconName,
} from './presets';
import { Button, ButtonProps } from '../Button/Button';
import { HStack } from '../Stack';

const alertWrapperStyle = prepareNativeStyle<
    Omit<InlineAlertBoxStyles, 'buttonColorScheme'> & { isButtonVisible: boolean }
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
    buttonProps?: Partial<ButtonProps>;
};

export const InlineAlertBox = ({
    title,
    buttonLabel,
    onButtonPress,
    iconName,
    buttonProps,
    variant = 'neutral',
    ...props
}: InlineAlertBoxProps) => {
    const { applyStyle } = useNativeStyles();
    const { backgroundColor, borderColor, buttonColorScheme } = variantToColorMap[variant];

    return (
        <HStack
            style={applyStyle(alertWrapperStyle, {
                borderColor,
                backgroundColor,
                isButtonVisible: Boolean(buttonLabel),
            })}
            {...props}
        >
            <Icon name={iconName || variantToIconName[variant]} size="mediumLarge" />
            <Text variant="hint" style={applyStyle(textStyle)}>
                {title}
            </Text>
            {buttonLabel && (
                <Button
                    size="small"
                    colorScheme={buttonColorScheme}
                    onPress={onButtonPress}
                    {...buttonProps}
                >
                    {buttonLabel}
                </Button>
            )}
        </HStack>
    );
};
