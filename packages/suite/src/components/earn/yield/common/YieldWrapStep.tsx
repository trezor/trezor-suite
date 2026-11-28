import { type ReactNode } from 'react';

import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import type {
    YieldFlowDisplayToken,
    YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { Button, Column, Row } from '@trezor/components';

import {
    EarnAmountCard,
    type EarnAmountCardFiatToggleProps,
} from '#src/components/earn/common/EarnAmountCard';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

import { YieldPendingTransaction } from './YieldPendingTransaction';
import { YieldReceivingRow } from './YieldReceivingRow';

type YieldWrapStepProps = {
    token: YieldFlowDisplayToken;
    availableAmount: string;
    onMaxClick: () => void;
    onSubmit: () => void;
    onSkip?: () => void;
    shouldShowReceivingRow?: boolean;
    receivingAmount?: string;
    isSubmitting?: boolean;
    isSubmitDisabled?: boolean;
    warning?: ReactNode;
    pendingTransaction?: YieldPendingTransactionState;
    fiatToggle?: EarnAmountCardFiatToggleProps;
    onPendingTxClick?: (txid: string) => void;
};

export const YieldWrapStep = ({
    token,
    availableAmount,
    onMaxClick,
    onSubmit,
    onSkip,
    shouldShowReceivingRow = true,
    receivingAmount = '0',
    isSubmitting = false,
    isSubmitDisabled = false,
    warning,
    pendingTransaction,
    fiatToggle,
    onPendingTxClick,
}: YieldWrapStepProps) => (
    <Column gap={16}>
        <EarnAmountCard
            testIdPrefix="@yield/form"
            tokenSymbol={<AssetSymbol networkSymbol={token.networkSymbol} />}
            decimals={token.decimals}
            isDisabled={!!pendingTransaction}
            // The wrap amount is the native coin, so no token contract address.
            approxFiat={{ symbol: token.networkSymbol }}
            heading={{
                amountLabelTranslationId: 'TR_EARN_YIELD_WRAP_AMOUNT',
            }}
            summary={{
                labelTranslationId: 'TR_EARN_YIELD_AVAILABLE_TO_WRAP',
                value: (
                    <FormattedCryptoAmount
                        value={availableAmount}
                        networkSymbol={token.networkSymbol}
                        tokenDecimals={token.decimals}
                    />
                ),
                onMaxClick: pendingTransaction ? undefined : onMaxClick,
            }}
            fiatToggle={pendingTransaction ? undefined : fiatToggle}
            warning={warning}
        />

        {shouldShowReceivingRow && (
            <YieldReceivingRow
                token={token}
                amount={receivingAmount}
                testId="@yield/form/wrap-receiving-amount-with-symbol"
            />
        )}

        <Row gap={8} width="100%">
            <Button
                size="large"
                flex="1"
                onClick={onSubmit}
                isLoading={isSubmitting}
                isDisabled={isSubmitDisabled || !!pendingTransaction}
                data-testid="@yield/form/wrap-button"
            >
                <Translation
                    id="TR_EARN_YIELD_WRAP_SUBMIT"
                    values={{ nativeSymbol: <AssetSymbol networkSymbol={token.networkSymbol} /> }}
                />
            </Button>
            {onSkip && (
                <Button
                    size="large"
                    intent="neutral"
                    priority="secondary"
                    onClick={onSkip}
                    isDisabled={isSubmitting || !!pendingTransaction}
                    data-testid="@yield/form/wrap-skip-button"
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
