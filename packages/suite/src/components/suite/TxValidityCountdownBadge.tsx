import { type ReactNode } from 'react';

import { type TranslationKey } from '@suite/intl';
import { Badge, Text } from '@trezor/components';

import { CountdownTimer } from './CountdownTimer';

type TxValidityCountdownBadgeProps = {
    deadline: number;
    pastDeadlineMessage: TranslationKey;
    children?: ReactNode;
    'data-testid'?: string;
};

export const TxValidityCountdownBadge = ({
    deadline,
    pastDeadlineMessage,
    children,
    'data-testid': dataTestId,
}: TxValidityCountdownBadgeProps) => (
    <Badge intent="warning">
        <Text isTabular data-testid={dataTestId}>
            {children ?? (
                <CountdownTimer
                    deadline={deadline}
                    unitDisplay="narrow"
                    message="TR_TX_CONFIRMATION_TIMER_SHORT"
                    pastDeadlineMessage={pastDeadlineMessage}
                />
            )}
        </Text>
    </Badge>
);
