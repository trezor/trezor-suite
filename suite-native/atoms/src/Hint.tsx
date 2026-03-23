import { type ReactNode } from 'react';

import { Icon, type IconName } from '@suite-native/icons';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { HStack } from './Stack';
import { Text } from './Text';

export const HINT_VARIANTS = ['hint', 'error', 'info'] as const;
export type HintVariant = (typeof HINT_VARIANTS)[number];

export type HintProps = {
    variant?: HintVariant;
    style?: NativeStyleObject;
    children?: ReactNode;
};

const hintStyle = prepareNativeStyle(() => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
}));

const hintTextStyle = prepareNativeStyle<{ color: Color }>((utils, { color }) => ({
    ...utils.typography['body-xs'],
    color: utils.colors[color],
    flex: 1,
}));

const hintVariants: Record<HintVariant, { iconName: IconName; color: Color }> = {
    hint: {
        color: 'textSubdued',
        iconName: 'question',
    },
    error: {
        color: 'textAlertRed',
        iconName: 'warningCircle',
    },
    info: {
        color: 'textAlertBlue',
        iconName: 'info',
    },
};

export const Hint = ({ style, children, variant = 'hint' }: HintProps) => {
    const { applyStyle } = useNativeStyles();

    const { iconName, color } = hintVariants[variant];

    return (
        <HStack style={[applyStyle(hintStyle), style]}>
            <Icon name={iconName} color={color} size="medium" />
            <Text style={applyStyle(hintTextStyle, { color })}>{children}</Text>
        </HStack>
    );
};
