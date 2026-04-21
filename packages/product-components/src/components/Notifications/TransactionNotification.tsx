import { type ReactNode } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, Row, Text } from '@trezor/components';

import { TransactionAmount } from './TransactionAmount';
import { TransactionIcon } from './TransactionIcon';
import {
    type TransactionNotificationToken,
    type TransactionNotificationType,
} from './notificationsTypes';

export type TransactionNotificationProps = {
    message: ReactNode;
    amount: ReactNode;
    notificationType: TransactionNotificationType;
    symbol: NetworkSymbol;
    token?: TransactionNotificationToken;
    icon?: ReactNode;
    tokenSymbol?: string;
    isInfiniteApproval?: boolean;
    unlimitedApprovalLabel?: ReactNode;
    renderAmount?: (amount: ReactNode) => ReactNode;
};

export const TransactionNotification = ({
    message,
    amount,
    notificationType,
    symbol,
    token,
    icon,
    tokenSymbol,
    isInfiniteApproval,
    unlimitedApprovalLabel,
    renderAmount,
}: TransactionNotificationProps) => (
    <Column gap={4}>
        <Text typographyStyle="body-md-strong">{message}</Text>
        <Row gap={8} alignItems="center">
            <TransactionIcon
                icon={icon}
                notificationType={notificationType}
                symbol={symbol}
                token={token}
            />
            <TransactionAmount
                amount={amount}
                notificationType={notificationType}
                symbol={symbol}
                token={token}
                tokenSymbol={tokenSymbol}
                isInfiniteApproval={isInfiniteApproval}
                unlimitedApprovalLabel={unlimitedApprovalLabel}
                renderAmount={renderAmount}
            />
        </Row>
    </Column>
);
