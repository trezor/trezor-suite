import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, InfoItem, Paragraph } from '@trezor/components';
import { ChecksIcon, LightningIcon } from '@trezor/icons';

type ReadyToClaimCardProps = {
    amount: ReactNode;
    action: ReactNode;
    'data-testid': string;
};

export const ReadyToClaimCard = ({
    amount,
    action,
    'data-testid': testId,
}: ReadyToClaimCardProps) => (
    <Card data-testid={testId}>
        <Column flex="1" gap={24}>
            <InfoItem
                label={<Translation id="TR_STAKE_UNSTAKED_AND_READY_TO_CLAIM" />}
                icon={ChecksIcon}
            >
                {amount}
            </InfoItem>
            <InfoItem label={<Translation id="TR_STAKE_TIME_TO_CLAIM" />} icon={LightningIcon}>
                <Paragraph typographyStyle="headline-sm">
                    <Translation id="TR_EARN_INSTANTLY" />
                </Paragraph>
            </InfoItem>
            {action}
        </Column>
    </Card>
);
