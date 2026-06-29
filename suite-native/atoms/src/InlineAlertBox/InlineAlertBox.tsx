import { type ReactNode } from 'react';

import { type RequireOneOrNone } from 'type-fest';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type BoxProps } from '../Box';
import { Button, type ButtonProps } from '../Button/Button';
import { IconButton } from '../Button/IconButton';
import { type AlertBoxStyles, intentToColorMap, intentToIconName } from '../FullAlertBox/presets';
import { type AlertBoxIntent } from '../FullAlertBox/types';
import { HStack } from '../Stack';
import { Text } from '../Text';

const alertWrapperStyle = prepareNativeStyle<
    Pick<AlertBoxStyles, 'borderColor' | 'backgroundColor'> & { isButtonDisplayed: boolean }
>((utils, { borderColor, backgroundColor, isButtonDisplayed }) => ({
    alignItems: 'center',
    borderRadius: utils.borders.radii.r12,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors[borderColor],
    backgroundColor: utils.colors[backgroundColor],
    paddingVertical: isButtonDisplayed ? utils.spacings.sp8 : utils.spacings.sp10,
    paddingRight: isButtonDisplayed ? utils.spacings.sp8 : utils.spacings.sp16,
    paddingLeft: utils.spacings.sp16,
}));

const textStyle = prepareNativeStyle(utils => ({
    flex: 1,
    paddingTop: utils.spacings.sp2,
    paddingRight: utils.spacings.sp12,
}));

export type InlineAlertBoxProps = Omit<BoxProps, 'style'> & {
    title: Exclude<ReactNode, null | undefined>;
    intent?: AlertBoxIntent;
    onButtonPress?: () => void;
    iconName?: IconName;
    buttonProps?: Partial<ButtonProps>;
} & RequireOneOrNone<{
        buttonLabel: ReactNode;
        isCloseButtonDisplayed: boolean;
    }>;

export const InlineAlertBox = ({
    title,
    buttonLabel,
    isCloseButtonDisplayed = false,
    onButtonPress,
    iconName,
    buttonProps,
    intent = 'neutral',
    ...props
}: InlineAlertBoxProps) => {
    const { applyStyle } = useNativeStyles();
    const { backgroundColor, borderColor, textColor } = intentToColorMap[intent];
    const isTextButtonDisplayed = Boolean(buttonLabel);
    const isButtonDisplayed = isTextButtonDisplayed || isCloseButtonDisplayed;

    return (
        <HStack
            style={applyStyle(alertWrapperStyle, {
                borderColor,
                backgroundColor,
                isButtonDisplayed,
            })}
            spacing="sp8"
            {...props}
        >
            <Icon
                name={iconName || intentToIconName[intent]}
                color={textColor}
                size="mediumLarge"
            />

            <Text variant="body-sm" color={textColor} style={applyStyle(textStyle)}>
                {title}
            </Text>
            {isTextButtonDisplayed && (
                <Button
                    size="medium"
                    priority="primary"
                    intent={intent}
                    onPress={onButtonPress}
                    {...buttonProps}
                >
                    {buttonLabel}
                </Button>
            )}
            {isCloseButtonDisplayed && (
                <IconButton
                    iconName="x"
                    size="medium"
                    intent={intent}
                    priority="secondary"
                    onPress={onButtonPress}
                    {...buttonProps}
                />
            )}
        </HStack>
    );
};
