import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type YieldFlowDisplayToken,
    buildLidoClaimWithdrawalsTransaction,
    getLidoClaimableAmount,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Button, Card, Column, Row, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

import { LidoFlowComplete } from './LidoFlowComplete';
import { useLidoStaking } from './useLidoStaking';
import { useLidoTransaction } from './useLidoTransaction';
import { useLidoWithdrawalRequests } from './useLidoWithdrawalRequests';
import { YieldPendingTransaction } from '../../yield/common/YieldPendingTransaction';

type LidoClaimProps = {
    account: Account;
};

export const LidoClaim = ({ account }: LidoClaimProps) => {
    const { deployment } = useLidoStaking(account);
    const {
        claimableRequests,
        isUnknown: areWithdrawalsUnread,
        isError: hasWithdrawalsError,
        refetch: refetchWithdrawals,
    } = useLidoWithdrawalRequests(account);
    const transaction = useLidoTransaction({ account, kind: 'claim' });

    const { decimals } = getNetwork(account.symbol);
    const nativeToken: YieldFlowDisplayToken = {
        networkSymbol: account.symbol,
        symbol: getNetworkDisplaySymbol(account.symbol),
        decimals,
    };
    const displaySymbol = <AssetSymbol networkSymbol={account.symbol} />;

    if (deployment === null) {
        return (
            <Banner intent="warning" description={<Translation id="TR_EARN_LIDO_UNAVAILABLE" />} />
        );
    }

    if (transaction.isConfirmed) {
        return (
            <LidoFlowComplete
                account={account}
                kind="claim"
                heading={<Translation id="TR_EARN_LIDO_CLAIM_COMPLETE" />}
                description={
                    <Translation
                        id="TR_EARN_LIDO_CLAIM_COMPLETE_DESCRIPTION"
                        values={{ displaySymbol }}
                    />
                }
            />
        );
    }

    // What the queue pays out for the finalized requests, read from the queue itself.
    const claimableAmount = new BigNumber(getLidoClaimableAmount(claimableRequests))
        .shiftedBy(-decimals)
        .toFixed();
    const hasClaimableRequests = claimableRequests.length > 0;
    const hasPendingTransaction = transaction.pendingTxid !== null;

    const handleClaim = () => {
        const claimTransaction = buildLidoClaimWithdrawalsTransaction({
            deployment,
            requestIds: claimableRequests.map(({ id }) => id),
            hints: claimableRequests.map(({ hint }) => hint),
        });

        if (claimTransaction === null) {
            return;
        }

        return transaction.submit({
            transaction: claimTransaction,
            amount: claimableAmount,
            token: nativeToken,
        });
    };

    return (
        <Column gap={16}>
            <Text typographyStyle="headline-md" data-testid="@staking/lido-claim/title">
                <Translation id="TR_EARN_LIDO_CLAIM_TITLE" values={{ displaySymbol }} />
            </Text>

            {hasWithdrawalsError && (
                <Banner
                    intent="warning"
                    data-testid="@staking/lido-claim/withdrawals-unknown"
                    description={<Translation id="TR_EARN_LIDO_WITHDRAWALS_UNKNOWN" />}
                    rightContent={
                        <Banner.Button onClick={refetchWithdrawals}>
                            <Translation id="TR_TRY_AGAIN" />
                        </Banner.Button>
                    }
                />
            )}

            {(hasClaimableRequests || hasPendingTransaction) && (
                <Card type="contrast" paddingType="small">
                    <Row justifyContent="space-between" alignItems="center" gap={8}>
                        <Text typographyStyle="body-md">
                            <Translation id="TR_EARN_LIDO_CLAIM_AMOUNT" />
                        </Text>
                        <Text typographyStyle="body-md" data-testid="@staking/lido-claim/amount">
                            <FormattedCryptoAmount
                                value={transaction.broadcast?.amount || claimableAmount}
                                networkSymbol={account.symbol}
                            />
                        </Text>
                    </Row>
                </Card>
            )}

            {/* An empty queue is only reported once a read has said so. */}
            {!hasClaimableRequests && !hasPendingTransaction && !areWithdrawalsUnread && (
                <Banner intent="info" description={<Translation id="TR_EARN_LIDO_CLAIM_EMPTY" />} />
            )}

            <Button
                size="large"
                width="100%"
                onClick={handleClaim}
                isLoading={transaction.isSubmitting}
                isDisabled={!hasClaimableRequests || hasPendingTransaction || hasWithdrawalsError}
                data-testid="@staking/lido-claim/submit-button"
            >
                <Translation id="TR_EARN_LIDO_CLAIM_SUBMIT" values={{ displaySymbol }} />
            </Button>

            {transaction.pendingTxid !== null && (
                <YieldPendingTransaction
                    pendingTransaction={{
                        type: 'claim',
                        txid: transaction.pendingTxid,
                        amount: transaction.broadcast?.amount ?? '',
                    }}
                    onTxClick={transaction.openTxDetail}
                />
            )}
        </Column>
    );
};
