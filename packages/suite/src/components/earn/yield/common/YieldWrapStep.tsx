import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import type {
    YieldFlowDisplayToken,
    YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { Box, Button, Card, Column, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { TruncatedAmount } from './TruncatedAmount';
import { YieldAmountCard, type YieldAmountCardFiatToggleProps } from './YieldAmountCard';
import { YieldPendingTransaction } from './YieldPendingTransaction';

type YieldWrapStepProps = {
    token: YieldFlowDisplayToken;
    nativeSymbol: string;
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
    fiatToggle?: YieldAmountCardFiatToggleProps;
    onPendingTxClick?: (txid: string) => void;
};

export const YieldWrapStep = ({
    token,
    nativeSymbol,
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
        <YieldAmountCard
            tokenSymbol={nativeSymbol}
            decimals={token.decimals}
            isDisabled={!!pendingTransaction}
            // The wrap amount is the native coin, so no token contract address.
            approxFiat={{ symbol: token.networkSymbol }}
            heading={{
                amountLabelTranslationId: 'TR_BALANCE',
            }}
            summary={{
                labelTranslationId: 'TR_EARN_YIELD_AVAILABLE_TO_WRAP',
                value: (
                    <FormattedCryptoAmount
                        value={availableAmount}
                        symbol={nativeSymbol}
                        tokenDecimals={token.decimals}
                    />
                ),
                onMaxClick: pendingTransaction ? undefined : onMaxClick,
            }}
            fiatToggle={pendingTransaction ? undefined : fiatToggle}
            warning={warning}
        />

        {shouldShowReceivingRow && (
            <Card type="contrast" paddingType="small">
                <Row justifyContent="space-between" alignItems="center" width="100%" gap={8}>
                    <Text typographyStyle="body-md">
                        <Translation id="TR_EARN_YIELD_WRAP_RECEIVING" />
                    </Text>
                    <Row alignItems="center" gap={8} minWidth={0}>
                        <TokenIcon
                            size={20}
                            symbol={token.networkSymbol}
                            contractAddress={token.contractAddress ?? null}
                            placeholder={token.symbol}
                            showNetworkIcon
                            isBordered={false}
                        />
                        <Box minWidth={0}>
                            <TruncatedAmount>
                                <Text typographyStyle="body-md" ellipsisLineCount={1}>
                                    <FormattedCryptoAmount
                                        value={receivingAmount}
                                        symbol={token.symbol}
                                    />
                                </Text>
                            </TruncatedAmount>
                        </Box>
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
