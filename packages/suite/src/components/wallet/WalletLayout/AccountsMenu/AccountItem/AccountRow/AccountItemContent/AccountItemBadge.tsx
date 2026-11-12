import { type ReactNode } from 'react';

import { Box, Icon, type IconComponent, Row, Text } from '@trezor/components';

type AccountItemBadgeProps = {
    icon?: IconComponent;
    additionalIcon?: IconComponent;
    intent?: 'neutral' | 'warning' | 'info';
    children?: ReactNode;
};

const backgroundColorByIntent = {
    neutral: 'elementFillNeutralSoft',
    warning: 'elementFillWarningSoft',
    info: 'elementFillInfoSoft',
} as const;

export const AccountItemBadge = ({
    icon,
    additionalIcon,
    intent = 'neutral',
    children,
}: AccountItemBadgeProps) => (
    <Box
        backgroundColor={backgroundColorByIntent[intent]}
        minWidth={0}
        maxWidth="100%"
        borderRadius={20}
        padding={{ horizontal: 8, vertical: 2 }}
    >
        <Row gap={4} minWidth={0}>
            {icon && (
                <Icon
                    as={icon}
                    size={16}
                    intent={intent}
                    priority={intent === 'neutral' ? 'secondary' : 'primary'}
                />
            )}
            {additionalIcon && (
                <Icon as={additionalIcon} size={16} intent={intent} priority="primary" />
            )}
            {children !== undefined && (
                <Text
                    typographyStyle="body-xs"
                    intent={intent}
                    priority="secondary"
                    minWidth={0}
                    ellipsisLineCount={1}
                >
                    {children}
                </Text>
            )}
        </Row>
    </Box>
);
