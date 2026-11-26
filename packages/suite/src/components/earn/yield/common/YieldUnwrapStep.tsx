import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import type { YieldPendingTransactionState } from '@suite-common/wallet-core';
import { Button, Column, Row } from '@trezor/components';

import {
    EarnAmountCard,
    type EarnAmountCardFiatToggleProps,
    type EarnApproxFiat,
} from '#src/components/earn/common/EarnAmountCard';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

import { YieldPendingTransaction } from './YieldPendingTransaction';

type YieldUnwrapStepProps = {
    tokenSymbol: string;
    tokenDecimals: number;
    tokenBalance: string;
    approxFiat?: EarnApproxFiat;
    onMaxClick: () => void;
    onSubmit: () => void;
    onSkip?: () => void;
    isSubmitting?: boolean;
    isSubmitDisabled?: boolean;
    warning?: ReactNode;
    pendingTransaction?: YieldPendingTransactionState;
    fiatToggle?: EarnAmountCardFiatToggleProps;
    onPendingTxClick?: (txid: string) => void;
};

export const YieldUnwrapStep = ({
    tokenSymbol,
    tokenDecimals,
    tokenBalance,
    approxFiat,
    onMaxClick,
    onSubmit,
    onSkip,
    isSubmitting = false,
    isSubmitDisabled = false,
    warning,
    pendingTransaction,
    fiatToggle,
    onPendingTxClick,
}: YieldUnwrapStepProps) => (
    <Column gap={16}>
        <EarnAmountCard
            testIdPrefix="@yield/form"
            tokenSymbol={tokenSymbol}
            decimals={tokenDecimals}
            isDisabled={!!pendingTransaction}
            approxFiat={approxFiat}
            heading={{
                amountLabelTranslationId: 'TR_EARN_YIELD_UNWRAP_AMOUNT',
            }}
            summary={{
                labelTranslationId: 'TR_BALANCE',
                value: (
                    <FormattedCryptoAmount
                        value={tokenBalance}
                        networkSymbol={tokenSymbol}
                        tokenDecimals={tokenDecimals}
                    />
                ),
                onMaxClick: pendingTransaction ? undefined : onMaxClick,
            }}
            fiatToggle={pendingTransaction ? undefined : fiatToggle}
            warning={warning}
        />

        <Row gap={8} width="100%">
            <Button
                size="large"
                flex="1"
                onClick={onSubmit}
                isLoading={isSubmitting}
                isDisabled={isSubmitDisabled || !!pendingTransaction}
                data-testid="@yield/form/unwrap-button"
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
                    data-testid="@yield/form/unwrap-skip-button"
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
