import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import type { YieldPendingTransactionState } from '@suite-common/wallet-core';
import { Button, Column, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { YieldPendingTransaction } from './YieldPendingTransaction';
import { YieldReceivingCard } from './YieldReceivingCard';

export type YieldUnwrapStepProps = {
    networkSymbol: NetworkSymbol;
    tokenSymbol: string;
    nativeSymbol: string;
    unwrapAmount: string;
    isLoading?: boolean;
    pendingTransaction?: YieldPendingTransactionState;
    onSubmit: () => void;
    onPendingTxClick: (txid: string) => void;
};

export const YieldUnwrapStep = ({
    networkSymbol,
    tokenSymbol,
    nativeSymbol,
    unwrapAmount,
    isLoading = false,
    pendingTransaction,
    onSubmit,
    onPendingTxClick,
}: YieldUnwrapStepProps) => (
    <Column gap={16}>
        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
            <Translation
                id="TR_EARN_YIELD_UNWRAP_STEP_DESCRIPTION"
                values={{
                    amount: (
                        <FormattedCryptoAmount
                            value={unwrapAmount}
                            symbol={tokenSymbol}
                            isBalance
                        />
                    ),
                    nativeSymbol,
                    tokenSymbol,
                }}
            />
        </Text>

        {!pendingTransaction && (
            <YieldReceivingCard
                token={{
                    symbol: nativeSymbol,
                    networkSymbol,
                    contractAddress: null,
                }}
                amount={unwrapAmount}
            />
        )}

        <Button
            size="large"
            width="100%"
            onClick={onSubmit}
            isDisabled={isLoading || !!pendingTransaction}
            isLoading={isLoading}
        >
            <Translation id="TR_EARN_YIELD_UNWRAP_BUTTON" values={{ nativeSymbol, tokenSymbol }} />
        </Button>

        {pendingTransaction && (
            <YieldPendingTransaction
                pendingTransaction={pendingTransaction}
                onTxClick={onPendingTxClick}
            />
        )}
    </Column>
);
