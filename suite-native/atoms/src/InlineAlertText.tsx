import { ReactNode } from 'react';

import { Icon, IconName } from '@suite-native/icons';
import { Color } from '@trezor/theme';

import { HStack } from './Stack';
import { Text } from './Text';

type Variant = 'info' | 'success' | 'critical';

export type InlineAlertTextProps = {
    variant: Variant;
    children: ReactNode;
};

type VariantConfig = {
    icon: IconName;
    color: Color;
};

const variants = {
    info: {
        icon: 'info',
        color: 'textAlertBlue',
    },
    success: {
        icon: 'checkCircle',
        color: 'textPrimaryDefault',
    },
    critical: {
        icon: 'warningCircle',
        color: 'textAlertRed',
    },
} as const satisfies Record<Variant, VariantConfig>;

export const InlineAlertText = ({ variant, children }: InlineAlertTextProps) => {
    const { color, icon } = variants[variant];

    return (
        <HStack>
            <Icon name={icon} color={color} size="mediumLarge" />
            <Text variant="hint" color={color}>
                {children}
            </Text>
        </HStack>
    );
};
