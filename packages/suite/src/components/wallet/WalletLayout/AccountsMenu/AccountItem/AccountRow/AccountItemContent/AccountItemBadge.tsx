import { type ReactNode } from 'react';

import { Box, Icon, type IconComponent, Row, Text } from '@trezor/components';

type AccountItemBadgeProps = {
    icon?: IconComponent;
    additionalIcon?: IconComponent;
    intent?: 'neutral' | 'warning';
    children?: ReactNode;
};

export const AccountItemBadge = ({
    icon,
    additionalIcon,
    intent = 'neutral',
    children,
}: AccountItemBadgeProps) => (
    <Box
        backgroundColor={intent === 'warning' ? 'elementFillWarningSoft' : 'elementFillNeutralSoft'}
        borderRadius={20}
        padding={{ horizontal: 8, vertical: 2 }}
    >
        <Row gap={4}>
            {icon && (
                <Icon
                    as={icon}
                    size={16}
                    intent={intent}
                    priority={intent === 'warning' ? 'primary' : 'secondary'}
                />
            )}
            {additionalIcon && (
                <Icon as={additionalIcon} size={16} intent={intent} priority="primary" />
            )}
            {children !== undefined && (
                <Text typographyStyle="body-xs" intent={intent} priority="secondary">
                    {children}
                </Text>
            )}
        </Row>
    </Box>
);
