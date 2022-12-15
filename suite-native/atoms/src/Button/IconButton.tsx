import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon, IconName } from '@trezor/icons';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ButtonColorScheme, ButtonSize } from './Button';

type IconButtonProps = {
    iconName: IconName;
    onPress: () => void;
    isRounded?: boolean;
    colorScheme?: ButtonColorScheme;
    size?: ButtonSize;
    style?: NativeStyleObject;
};

type StyleProps = {
    isRounded: boolean;
    size: ButtonSize;
    colorScheme: ButtonColorScheme;
};

const iconButtonStyle = prepareNativeStyle<StyleProps>(
    (utils, { isRounded, colorScheme, size }) => {
        const colorSchemeStyles = {
            primary: {
                backgroundColor: utils.colors.green,
            },
            gray: {
                backgroundColor: utils.colors.gray300,
            },
            red: {
                backgroundColor: utils.transparentize(0.9, utils.colors.red),
            },
        };

        const sizeStyles = {
            small: {
                width: 16,
                height: 16,
                borderRadius: isRounded ? utils.borders.radii.round : utils.borders.radii.small / 2,
            },
            medium: {
                width: 32,
                height: 32,
                borderRadius: isRounded ? utils.borders.radii.round : utils.borders.radii.small,
            },
            large: {
                width: 48,
                height: 48,
                borderRadius: isRounded ? utils.borders.radii.round : utils.borders.radii.small,
            },
        };
        return {
            justifyContent: 'center',
            alignItems: 'center',
            ...colorSchemeStyles[colorScheme],
            ...sizeStyles[size],
        };
    },
);

const getIconColor = (colorScheme: ButtonColorScheme) => {
    switch (colorScheme) {
        case 'gray':
            return 'gray700';
        case 'red':
            return 'red';
        default:
            return 'gray0';
    }
};

export const IconButton = ({
    iconName,
    onPress,
    style,
    colorScheme = 'primary',
    size = 'medium',
    isRounded = false,
}: IconButtonProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[applyStyle(iconButtonStyle, { isRounded, size, colorScheme }), style]}
        >
            <Icon name={iconName} color={getIconColor(colorScheme)} size={size} />
        </TouchableOpacity>
    );
};
