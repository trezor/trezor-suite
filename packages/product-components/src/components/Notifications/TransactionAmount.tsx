import { type ReactNode } from 'react';

import { Row } from '@trezor/components';

import { type TransactionNotificationType } from './notificationsTypes';

type TransactionAmountProps = {
    amount: ReactNode;
    notificationType: TransactionNotificationType;
    displaySymbol: string;
    isInfiniteApproval?: boolean;
    unlimitedApprovalLabel?: ReactNode;
    renderAmount?: (amount: ReactNode) => ReactNode;
};

export const TransactionAmount = ({
    amount,
    notificationType,
    displaySymbol,
    isInfiniteApproval,
    unlimitedApprovalLabel,
    renderAmount,
}: TransactionAmountProps) => {
    const shouldRenderApprovalAmountWithSymbol =
        notificationType === 'tx-approved' || notificationType === 'tx-revoked';
    const resolvedAmountValue =
        notificationType === 'tx-approved' && isInfiniteApproval
            ? (unlimitedApprovalLabel ?? amount)
            : amount;

    const amountContent = shouldRenderApprovalAmountWithSymbol ? (
        <Row display="inline-flex" gap={4} alignItems="baseline">
            {resolvedAmountValue}
            <span>{displaySymbol}</span>
        </Row>
    ) : (
        resolvedAmountValue
    );

    return renderAmount ? renderAmount(amountContent) : amountContent;
};
