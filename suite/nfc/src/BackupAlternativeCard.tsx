import { type ComponentProps, type ReactNode } from 'react';

import {
    Badge,
    type BadgeIntent,
    Button,
    type ButtonIntent,
    Card,
    Column,
    H3,
    Text,
} from '@trezor/components';

interface BackupAlternativeCardProps {
    badge: ReactNode;
    badgeIntent?: BadgeIntent;
    heading: ReactNode;
    description: ReactNode;
    buttonLabel: ReactNode;
    buttonIntent?: ButtonIntent;
    buttonPriority?: ComponentProps<typeof Button>['priority'];
    onClick?: () => void;
}

export const BackupAlternativeCard = ({
    badge,
    badgeIntent = 'neutral',
    heading,
    description,
    buttonLabel,
    buttonIntent = 'brand',
    buttonPriority = 'primary',
    onClick,
}: BackupAlternativeCardProps) => (
    <Card paddingType="large" fillType="flat">
        <Column gap={32} alignItems="center">
            <Badge intent={badgeIntent}>{badge}</Badge>
            <Column gap={16} alignItems="center">
                <H3>{heading}</H3>
                <Text typographyStyle="body-md" align="center">
                    {description}
                </Text>
            </Column>
            <Button intent={buttonIntent} priority={buttonPriority} onClick={onClick}>
                {buttonLabel}
            </Button>
        </Column>
    </Card>
);
