import { ReactNode } from 'react';

import { Icon, IconName } from '@suite-common/icons-deprecated';
import { useNativeStyles, prepareNativeStyle, NativeStyleObject } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Text } from './Text';
import { HStack } from './Stack';

type HintVariant = 'hint' | 'error';

type HintProps = {
    variant?: HintVariant;
    style?: NativeStyleObject;
    children?: ReactNode;
};

const ICON_SIZE = 14;
const SPACE_SIZE = 6;

const hintStyle = prepareNativeStyle(() => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
}));

const hintTextStyle = prepareNativeStyle<{ color: Color }>((utils, { color }) => ({
    ...utils.typography.label,
    color: utils.colors[color],
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
};

export const Hint = ({ style, children, variant = 'hint' }: HintProps) => {
    const { applyStyle } = useNativeStyles();

    const { iconName, color } = hintVariants[variant];

    return (
        <HStack spacing={SPACE_SIZE} style={[applyStyle(hintStyle), style]}>
            <Icon name={iconName} color={color} size={ICON_SIZE} />
            <Text style={applyStyle(hintTextStyle, { color })}>{children}</Text>
        </HStack>
    );
};
