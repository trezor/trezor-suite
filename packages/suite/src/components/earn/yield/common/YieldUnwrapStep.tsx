import { type ReactNode } from 'react';

import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import type {
    YieldFlowDisplayToken,
    YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { Button, Column, Row } from '@trezor/components';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

import {
    YieldAmountCard,
    type YieldAmountCardFiatToggleProps,
    type YieldApproxFiat,
} from './YieldAmountCard';
import { YieldPendingTransaction } from './YieldPendingTransaction';
import { useYieldTokenDecimals } from '../hooks/useYieldTokenDecimals';

type YieldUnwrapStepProps = {
    /** The wrapped native token being unwrapped. */
    token: YieldFlowDisplayToken;
    tokenBalance: string;
    approxFiat?: YieldApproxFiat;
    onMaxClick: () => void;
    onSubmit: () => void;
    onSkip?: () => void;
    isSubmitting?: boolean;
    isSubmitDisabled?: boolean;
    warning?: ReactNode;
    pendingTransaction?: YieldPendingTransactionState;
    fiatToggle?: YieldAmountCardFiatToggleProps;
    onPendingTxClick?: (txid: string) => void;
};

export const YieldUnwrapStep = ({
    token,
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
}: YieldUnwrapStepProps) => {
    const decimals = useYieldTokenDecimals(token);
    const tokenSymbol = (
        <AssetSymbol networkSymbol={token.networkSymbol} contractAddress={token.contractAddress} />
    );

    return (
        <Column gap={16}>
            <YieldAmountCard
                tokenSymbol={tokenSymbol}
                decimals={decimals}
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
                            networkSymbol={token.networkSymbol}
                            contractAddress={token.contractAddress}
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
};
