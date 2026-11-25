import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Icon, Paragraph, Skeleton } from '@trezor/components';
import { CalendarIcon } from '@trezor/icons';

type PayoutCardProps = {
    days: number | null;
    /** Product info is not cached yet, so the days are not known either way. */
    isPending: boolean;
    label: ReactNode;
};

// A day count the product info is still to answer shows a skeleton; one it cannot answer says so.
export const PayoutCard = ({ days, isPending, label }: PayoutCardProps) => (
    <Card paddingType="small" flex="1">
        <Column alignItems="flex-start" flex="1" gap={20}>
            <Icon as={CalendarIcon} intent="neutral" priority="secondary" />
            <Column margin={{ top: 'auto' }}>
                {isPending ? (
                    <Skeleton width={80} height={32} animate />
                ) : (
                    <Paragraph
                        typographyStyle="headline-md"
                        data-testid="@staking/payout-card/days"
                    >
                        {days === null ? (
                            <Translation id="TR_EARN_N_A" />
                        ) : (
                            <Translation id="TR_STAKE_DAYS" values={{ count: days }} />
                        )}
                    </Paragraph>
                )}
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {label}
                </Paragraph>
            </Column>
        </Column>
    </Card>
);
