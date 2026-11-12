import { type ReactNode } from 'react';

import { Card, Column, IconCircle, Paragraph } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

type TradingUnavailableCardProps = {
    title: ReactNode;
    description: ReactNode;
    'data-testid'?: string;
};

export const TradingUnavailableCard = ({
    title,
    description,
    'data-testid': dataTestId,
}: TradingUnavailableCardProps) => (
    <Card
        width="100%"
        maxWidth={400}
        margin={{ horizontal: 'auto' }}
        paddingType="large"
        data-testid={dataTestId}
    >
        <Column alignItems="center" gap={4}>
            <IconCircle icon={WarningIcon} size={96} intent="warning" />
            <Paragraph typographyStyle="body-md-strong" align="center" margin={{ top: 16 }}>
                {title}
            </Paragraph>
            <Paragraph typographyStyle="body-sm" color="contentSecondary" align="center">
                {description}
            </Paragraph>
        </Column>
    </Card>
);
