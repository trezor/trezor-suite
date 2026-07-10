import type { ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import type {
    YieldFlowDisplayToken,
    YieldPendingTransactionState,
} from '@suite-common/wallet-core';
import { Banner, Button, Column, Text } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { YieldAmountCard } from './YieldAmountCard';
import { YieldPendingTransaction } from './YieldPendingTransaction';
import { YieldReceivingCard } from './YieldReceivingCard';

export type YieldWrapStepProps = {
    token: YieldFlowDisplayToken;
    nativeSymbol: string;
    nativeBalanceValue: ReactNode;
    wrapAmount: string;
    showReserveNotice?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
    warning?: ReactNode;
    pendingTransaction?: YieldPendingTransactionState;
    onMaxClick?: () => void;
    onSubmit: () => void;
    onPendingTxClick: (txid: string) => void;
};

export const YieldWrapStep = ({
    token,
    nativeSymbol,
    nativeBalanceValue,
    wrapAmount,
    showReserveNotice = false,
    isDisabled = false,
    isLoading = false,
    warning,
    pendingTransaction,
    onMaxClick,
    onSubmit,
    onPendingTxClick,
}: YieldWrapStepProps) => (
    <Column gap={16}>
        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
            <Translation id="TR_EARN_YIELD_WRAP_STEP_DESCRIPTION" values={{ nativeSymbol }} />
        </Text>

        <YieldAmountCard
            tokenSymbol={nativeSymbol}
            decimals={token.decimals}
            summary={{
                labelTranslationId: 'TR_BALANCE',
                value: nativeBalanceValue,
                onMaxClick: pendingTransaction ? undefined : onMaxClick,
            }}
            heading={{
                amountLabelTranslationId: 'TR_EARN_YIELD_AMOUNT_TO_WRAP',
            }}
            warning={warning}
            isDisabled={!!pendingTransaction}
        />

        {showReserveNotice && !pendingTransaction && (
            <Banner
                icon={InfoIcon}
                intent="info"
                description={
                    <Translation
                        id="TR_EARN_YIELD_WRAP_RESERVE_KEPT"
                        values={{
                            amount: WETH_WRAP_GAS_RESERVE.toString(),
                            networkDisplaySymbol: nativeSymbol,
                        }}
                    />
                }
            />
        )}

        {!pendingTransaction && <YieldReceivingCard token={token} amount={wrapAmount} />}

        <Button
            size="large"
            width="100%"
            onClick={onSubmit}
            isDisabled={isDisabled || !!pendingTransaction}
            isLoading={isLoading}
        >
            <Translation id="TR_EARN_YIELD_WRAP_BUTTON" values={{ nativeSymbol }} />
        </Button>

        {pendingTransaction && (
            <YieldPendingTransaction
                pendingTransaction={pendingTransaction}
                onTxClick={onPendingTxClick}
            />
        )}
    </Column>
);
