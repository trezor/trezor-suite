import { type ReactNode } from 'react';

import { AccountLabel } from '@suite/account';
import { HiddenPlaceholder } from '@suite/discreet-mode';
import { type Account } from '@suite-common/wallet-types';
import { Card, Column, Icon, Row, Text } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';

type EarnPositionCardProps = {
    icon: ReactNode;
    label: ReactNode;
    account: Account;
    fiatAmount: ReactNode;
    cryptoAmount: ReactNode;
    badges?: ReactNode;
    onClick?: () => void;
};

export const EarnPositionCard = ({
    icon,
    label,
    account,
    fiatAmount,
    cryptoAmount,
    badges,
    onClick,
}: EarnPositionCardProps) => (
    <Card onClick={onClick}>
        <Row alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={12}>
            <Row alignItems="center" gap={12}>
                {icon}

                <Column gap={2}>
                    <Text typographyStyle="body-md">{label}</Text>

                    <Row flexWrap="wrap" gap={8}>
                        <Text typographyStyle="body-sm" color="contentSecondary">
                            <AccountLabel
                                account={account}
                                showAccountTypeBadge
                                accountTypeBadgeSize="small"
                            />
                        </Text>

                        {badges}
                    </Row>
                </Column>
            </Row>

            <Row alignItems="center" gap={12} margin={{ left: 'auto' }}>
                <Column alignItems="flex-end" gap={2}>
                    <Text typographyStyle="body-md">{fiatAmount}</Text>

                    <Text typographyStyle="body-sm" color="contentSecondary">
                        <HiddenPlaceholder>{cryptoAmount}</HiddenPlaceholder>
                    </Text>
                </Column>

                {onClick && <Icon as={CaretRightIcon} size={20} color="contentSecondary" />}
            </Row>
        </Row>
    </Card>
);
