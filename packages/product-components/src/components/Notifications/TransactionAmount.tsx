import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { Row } from '@trezor/components';
import { type NetworkConfigState, type NetworkSymbol } from '@trezor/network-module-types';

import {
    type TransactionNotificationToken,
    type TransactionNotificationType,
} from './notificationsTypes';
import { selectDisplaySymbol } from '../../network-display/networkDisplaySelectors';

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
    const shouldRenderApprovalAmountWithSymbol =
        notificationType === 'tx-approved' || notificationType === 'tx-revoked';
    const resolvedTokenDisplaySymbol = useSelector((state: NetworkConfigState) =>
        selectDisplaySymbol(state, tokenSymbol ?? token?.symbol ?? symbol),
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
