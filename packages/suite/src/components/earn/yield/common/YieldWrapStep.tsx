import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import type {
    YieldFlowDisplayToken,
    YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { Button, Card, Column, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { YieldAmountCard } from './YieldAmountCard';
import { YieldPendingTransaction } from './YieldPendingTransaction';

type YieldWrapStepProps = {
    token: YieldFlowDisplayToken;
    nativeSymbol: string;
    nativeBalance: string;
    onMaxClick: () => void;
    onSubmit: () => void;
    onSkip?: () => void;
    shouldShowReceivingRow?: boolean;
    isSubmitting?: boolean;
    isSubmitDisabled?: boolean;
    warning?: ReactNode;
    pendingTransaction?: YieldPendingTransactionState;
    onPendingTxClick?: (txid: string) => void;
};

export const YieldWrapStep = ({
    token,
    nativeSymbol,
    nativeBalance,
    onMaxClick,
    onSubmit,
    onSkip,
    shouldShowReceivingRow = true,
    isSubmitting = false,
    isSubmitDisabled = false,
    warning,
    pendingTransaction,
    onPendingTxClick,
}: YieldWrapStepProps) => (
    <Column gap={16}>
        <YieldAmountCard
            tokenSymbol={nativeSymbol}
            decimals={token.decimals}
            isDisabled={!!pendingTransaction}
            heading={{
                amountLabelTranslationId: 'TR_EARN_YIELD_WRAP_AMOUNT',
            }}
            summary={{
                labelTranslationId: 'TR_BALANCE',
                value: <FormattedCryptoAmount value={nativeBalance} symbol={nativeSymbol} />,
                onMaxClick: pendingTransaction ? undefined : onMaxClick,
            }}
            warning={warning}
        />

        {shouldShowReceivingRow && (
            <Card type="contrast" paddingType="small">
                <Row justifyContent="space-between" alignItems="center" width="100%">
                    <Text typographyStyle="body-md">
                        <Translation id="TR_EARN_YIELD_WRAP_RECEIVING" />
                    </Text>
                    <Row alignItems="center" gap={8}>
                        <TokenIcon
                            size={20}
                            symbol={token.networkSymbol}
                            contractAddress={token.contractAddress ?? null}
                            placeholder={token.symbol}
                            showNetworkIcon
                            isBordered={false}
                        />
                        <Text typographyStyle="body-md">
                            <FormattedCryptoAmount value="0" symbol={token.symbol} />
                        </Text>
                    </Row>
                </Row>
            </Card>
        )}

        <Row gap={8} width="100%">
            <Button
                size="large"
                flex="1"
                onClick={onSubmit}
                isLoading={isSubmitting}
                isDisabled={isSubmitDisabled || !!pendingTransaction}
            >
                <Translation id="TR_EARN_YIELD_WRAP_SUBMIT" values={{ nativeSymbol }} />
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
