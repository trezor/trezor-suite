import { type ReactNode } from 'react';

import { Icon, type IconName } from '@suite-native/icons';
import { type Color } from '@trezor/theme';

import { HStack } from './Stack';
import { Text } from './Text';

export const INLINE_ALERT_TEXT_VARIANTS = ['info', 'success', 'critical'] as const;
export type InlineAlertTextVariant = (typeof INLINE_ALERT_TEXT_VARIANTS)[number];

export type InlineAlertTextProps = {
    variant: InlineAlertTextVariant;
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
} as const satisfies Record<InlineAlertTextVariant, VariantConfig>;

export const InlineAlertText = ({ variant, children }: InlineAlertTextProps) => {
    const { color, icon } = variants[variant];

    return (
        <HStack>
            <Icon name={icon} color={color} size="mediumLarge" />
            <Text variant="body-sm" color={color}>
                {children}
            </Text>
        </HStack>
    );
};
