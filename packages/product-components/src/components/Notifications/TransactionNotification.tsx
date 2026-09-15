import { type ReactNode } from 'react';

import { Column, Row, Text } from '@trezor/components';

import { TransactionAmount } from './TransactionAmount';
import { type TransactionNotificationType } from './notificationsTypes';

export type TransactionNotificationProps = {
    message: ReactNode;
    amount?: ReactNode;
    notificationType: TransactionNotificationType;
    icon: ReactNode;
    displaySymbol: string;
    isInfiniteApproval?: boolean;
    unlimitedApprovalLabel?: ReactNode;
    renderAmount?: (amount: ReactNode) => ReactNode;
    'data-testid'?: string;
};

export const TransactionNotification = ({
    message,
    amount,
    notificationType,
    icon,
    displaySymbol,
    isInfiniteApproval,
    unlimitedApprovalLabel,
    renderAmount,
    'data-testid': dataTestId,
}: TransactionNotificationProps) => (
    <Column gap={4}>
        <Text typographyStyle="body-md-strong" data-testid={dataTestId && `${dataTestId}/message`}>
            {message}
        </Text>
        {amount && (
            <Row gap={8} alignItems="center">
                {icon}
                <TransactionAmount
                    amount={amount}
                    notificationType={notificationType}
                    displaySymbol={displaySymbol}
                    isInfiniteApproval={isInfiniteApproval}
                    unlimitedApprovalLabel={unlimitedApprovalLabel}
                    renderAmount={renderAmount}
                />
            </Row>
        )}
    </Column>
);
