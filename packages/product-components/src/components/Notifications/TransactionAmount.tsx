import { type ReactNode } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import {
    type NetworkSymbol,
    getDisplaySymbol,
    selectNetworkConfigDeps,
} from '@suite-common/wallet-config';
import { Row } from '@trezor/components';

import {
    type TransactionNotificationToken,
    type TransactionNotificationType,
} from './notificationsTypes';

type TransactionAmountProps = {
    amount: ReactNode;
    notificationType: TransactionNotificationType;
    symbol: NetworkSymbol;
    token?: TransactionNotificationToken;
    tokenSymbol?: string;
    isInfiniteApproval?: boolean;
    unlimitedApprovalLabel?: ReactNode;
    renderAmount?: (amount: ReactNode) => ReactNode;
};

export const TransactionAmount = ({
    amount,
    notificationType,
    symbol,
    token,
    tokenSymbol,
    isInfiniteApproval,
    unlimitedApprovalLabel,
    renderAmount,
}: TransactionAmountProps) => {
    const deps = useServices(selectNetworkConfigDeps);
    const shouldRenderApprovalAmountWithSymbol =
        notificationType === 'tx-approved' || notificationType === 'tx-revoked';
    const resolvedTokenDisplaySymbol = getDisplaySymbol(
        deps,
        tokenSymbol ?? token?.symbol ?? symbol,
    );
    const resolvedAmountValue =
        notificationType === 'tx-approved' && isInfiniteApproval
            ? (unlimitedApprovalLabel ?? amount)
            : amount;

    const amountContent = shouldRenderApprovalAmountWithSymbol ? (
        <Row display="inline-flex" gap={4} alignItems="baseline">
            {resolvedAmountValue}
            <span>{resolvedTokenDisplaySymbol}</span>
        </Row>
    ) : (
        resolvedAmountValue
    );

    return renderAmount ? renderAmount(amountContent) : amountContent;
};
