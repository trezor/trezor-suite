import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import type { YieldPendingTransactionState } from '@suite-common/wallet-core';
import { Button, Column, Row } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { YieldAmountCard } from './YieldAmountCard';
import { YieldPendingTransaction } from './YieldPendingTransaction';

type YieldUnwrapStepProps = {
    tokenSymbol: string;
    tokenDecimals: number;
    tokenBalance: string;
    onMaxClick: () => void;
    onSubmit: () => void;
    onSkip?: () => void;
    isSubmitting?: boolean;
    isSubmitDisabled?: boolean;
    warning?: ReactNode;
    pendingTransaction?: YieldPendingTransactionState;
    onPendingTxClick?: (txid: string) => void;
};

export const YieldUnwrapStep = ({
    tokenSymbol,
    tokenDecimals,
    tokenBalance,
    onMaxClick,
    onSubmit,
    onSkip,
    isSubmitting = false,
    isSubmitDisabled = false,
    warning,
    pendingTransaction,
    onPendingTxClick,
}: YieldUnwrapStepProps) => (
    <Column gap={16}>
        <YieldAmountCard
            tokenSymbol={tokenSymbol}
            decimals={tokenDecimals}
            isDisabled={!!pendingTransaction}
            heading={{
                amountLabelTranslationId: 'TR_EARN_YIELD_UNWRAP_AMOUNT',
            }}
            summary={{
                labelTranslationId: 'TR_BALANCE',
                value: <FormattedCryptoAmount value={tokenBalance} symbol={tokenSymbol} />,
                onMaxClick: pendingTransaction ? undefined : onMaxClick,
            }}
            warning={warning}
        />

        <Row gap={8} width="100%">
            <Button
                size="large"
                flex="1"
                onClick={onSubmit}
                isLoading={isSubmitting}
                isDisabled={isSubmitDisabled || !!pendingTransaction}
            >
                <Translation id="TR_EARN_YIELD_UNWRAP_SUBMIT" values={{ tokenSymbol }} />
            </Button>
            {onSkip && (
                <Button
                    size="large"
                    intent="neutral"
                    priority="secondary"
                    onClick={onSkip}
                    isDisabled={isSubmitting || !!pendingTransaction}
                >
                    <Translation id="TR_SKIP" />
                </Button>
            )}
        </Row>

        {pendingTransaction && onPendingTxClick && (
            <YieldPendingTransaction
                pendingTransaction={pendingTransaction}
                onTxClick={onPendingTxClick}
            />
        )}
    </Column>
);
