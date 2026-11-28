import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { AssetSymbol } from '@suite/assets';
import { Form } from '@suite/form';
import { Translation } from '@suite/intl';
import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type YieldFlowFormValues,
    buildLidoApproveTransaction,
    buildLidoRequestWithdrawalsTransaction,
    convertWstETHToETH,
    fetchAllowance,
    getMinLidoWithdrawalAmount,
    splitLidoWithdrawalAmount,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Button, Card, Column, Row, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { EarnAmountCard } from '#src/components/earn/common/EarnAmountCard';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

import { LidoFlowComplete } from './LidoFlowComplete';
import { LidoWithdrawalSummary } from './LidoWithdrawalSummary';
import { useLidoStaking } from './useLidoStaking';
import { type LidoTransaction } from './useLidoTransaction';
import { YieldFlowStepList } from '../../yield/common/YieldFlowStepList';
import { YieldPendingTransaction } from '../../yield/common/YieldPendingTransaction';

const LIDO_WITHDRAWAL_STEPS = ['approve', 'action'] as const;

type LidoUnstakeQueueProps = {
    account: Account;
    // Owned above the choice of the exit, so they outlast a look at the swap.
    approval: LidoTransaction;
    request: LidoTransaction;
    initialAmount: string;
    onAmountChange: (amount: string) => void;
    onValueRetry: () => void;
};

export const LidoUnstakeQueue = ({
    account,
    approval,
    request,
    initialAmount,
    onAmountChange,
    onValueRetry,
}: LidoUnstakeQueueProps) => {
    const { deployment, wstETHToken, wstETHBalance, wstETHValue, withdrawalDays } =
        useLidoStaking(account);

    const methods = useForm<YieldFlowFormValues>({
        mode: 'onChange',
        defaultValues: { amountInput: initialAmount, fiatInput: '' },
    });
    const amountInput = useWatch({ control: methods.control, name: 'amountInput' });

    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is account.key; the descriptor, the symbol and the deployment all follow from the account
    const allowanceQuery = useQuery({
        queryKey: commonQueryKeys.lidoWithdrawalAllowance(account.key),
        queryFn: async () =>
            deployment === null
                ? '0'
                : (
                      await fetchAllowance({
                          owner: account.descriptor,
                          spender: deployment.withdrawalQueue,
                          tokenContractAddress: deployment.wstETH,
                          coin: account.symbol,
                      })
                  ).toFixed(0),
        enabled: deployment !== null,
    });
    const {
        data: allowance,
        isFetching: isAllowanceFetching,
        isError: isAllowanceError,
        refetch: refetchAllowance,
    } = allowanceQuery;

    useEffect(() => {
        onAmountChange(amountInput);
    }, [amountInput, onAmountChange]);

    if (deployment === null || wstETHToken === null) {
        return (
            <Banner intent="warning" description={<Translation id="TR_EARN_LIDO_UNAVAILABLE" />} />
        );
    }

    const { decimals } = getNetwork(account.symbol);
    const displaySymbol = <AssetSymbol networkSymbol={account.symbol} />;

    // Ahead of everything a missing read could hide: the request is made, whatever else is known.
    if (request.isConfirmed) {
        return (
            <LidoFlowComplete
                account={account}
                kind="request-withdrawal"
                statusLabelId="TR_EARN_LIDO_WITHDRAWAL_NFT_RECEIVED"
                heading={<Translation id="TR_EARN_LIDO_UNSTAKE_COMPLETE" />}
                description={
                    <Translation
                        id="TR_EARN_LIDO_UNSTAKE_COMPLETE_DESCRIPTION"
                        values={{ displaySymbol }}
                    />
                }
            >
                <LidoWithdrawalSummary
                    transaction={request.transaction}
                    withdrawalQueue={deployment.withdrawalQueue}
                    beneficiary={account.descriptor}
                    withdrawalDays={withdrawalDays}
                />
            </LidoFlowComplete>
        );
    }

    const balance = new BigNumber(wstETHBalance).shiftedBy(-wstETHToken.decimals);
    const amount = new BigNumber(amountInput || 0);
    const amountInSubunits = amount.shiftedBy(wstETHToken.decimals);
    const wstETHAmount = amountInSubunits.integerValue(BigNumber.ROUND_DOWN).toFixed(0);
    const isAmountTooHigh = amount.gt(balance);

    // The requests the amount makes are worked out before either step, so no approval is paid for
    // an amount the queue would then refuse. An amount over the balance is not split at all.
    const withdrawalAmounts =
        wstETHValue === null || isAmountTooHigh
            ? []
            : splitLidoWithdrawalAmount({ wstETHAmount, wstETHValue });
    const minWithdrawalAmount =
        wstETHValue === null
            ? null
            : new BigNumber(getMinLidoWithdrawalAmount({ wstETHValue }))
                  .shiftedBy(-wstETHToken.decimals)
                  .toFixed();
    const isAmountBelowMinimum = amount.gt(0) && !isAmountTooHigh && withdrawalAmounts.length === 0;
    // The same field is mounted under either step. Its amount remains valid while the active step
    // changes and React Hook Form registers the field again.
    const isAmountValid = withdrawalAmounts.length > 0 && amountInSubunits.isInteger();

    // An allowance that could not be read is not taken for none: an approval is only offered once
    // the allowance is known to be too low.
    const isAllowanceKnown = allowance !== undefined && !isAllowanceError;
    const allowanceAmount = new BigNumber(allowance ?? 0);
    const isApprovalNeeded =
        !isAllowanceKnown || allowanceAmount.lte(0) || allowanceAmount.lt(wstETHAmount);
    const hasPendingTransaction = approval.pendingTxid !== null || request.pendingTxid !== null;

    const currentStep =
        request.pendingTxid !== null || (approval.pendingTxid === null && !isApprovalNeeded)
            ? 'action'
            : 'approve';

    const handleApprove = methods.handleSubmit(() => {
        if (!isAmountValid || !isAllowanceKnown) {
            return;
        }

        const transaction = buildLidoApproveTransaction({
            deployment,
            owner: account.descriptor,
            wstETHAmount,
        });

        if (transaction === null) {
            return;
        }

        return approval.submit({ transaction, amount: amount.toFixed(), token: wstETHToken });
    });

    const handleRequest = methods.handleSubmit(() => {
        if (!isAmountValid || isApprovalNeeded) return;

        const transaction = buildLidoRequestWithdrawalsTransaction({
            deployment,
            owner: account.descriptor,
            wstETHAmounts: withdrawalAmounts,
        });

        if (transaction === null) {
            return;
        }

        return request.submit({ transaction, amount: amount.toFixed(), token: wstETHToken });
    });

    const amountForm = (
        <Column gap={16}>
            <EarnAmountCard
                testIdPrefix="@staking/lido-unstake"
                tokenSymbol={wstETHToken.symbol}
                decimals={wstETHToken.decimals}
                isDisabled={hasPendingTransaction}
                approxFiat={{
                    symbol: account.symbol,
                    tokenContractAddress: wstETHToken.contractAddress,
                }}
                heading={{ amountLabelTranslationId: 'TR_EARN_LIDO_UNSTAKE_AMOUNT' }}
                summary={{
                    labelTranslationId: 'TR_EARN_LIDO_UNSTAKE_AVAILABLE',
                    value: (
                        <FormattedCryptoAmount
                            value={balance.toFixed()}
                            networkSymbol={wstETHToken.symbol}
                        />
                    ),
                    onMaxClick: hasPendingTransaction
                        ? undefined
                        : () =>
                              methods.setValue('amountInput', balance.toFixed(), {
                                  shouldValidate: true,
                              }),
                }}
                warning={
                    <>
                        {isAmountTooHigh && (
                            <Banner
                                intent="warning"
                                description={<Translation id="TR_NOT_ENOUGH_FUNDS" />}
                            />
                        )}

                        {isAmountBelowMinimum && minWithdrawalAmount !== null && (
                            <Banner
                                intent="warning"
                                data-testid="@staking/lido-unstake/below-minimum"
                                description={
                                    <Translation
                                        id="AMOUNT_IS_BELOW_DUST"
                                        values={{
                                            dust: (
                                                <FormattedCryptoAmount
                                                    value={minWithdrawalAmount}
                                                    networkSymbol={wstETHToken.symbol}
                                                />
                                            ),
                                        }}
                                    />
                                }
                            />
                        )}
                    </>
                }
            />

            {wstETHValue === null ? (
                <Banner
                    intent="warning"
                    data-testid="@staking/lido-unstake/value-unknown"
                    description={<Translation id="TR_EARN_LIDO_VALUE_UNKNOWN" />}
                    rightContent={
                        <Banner.Button onClick={onValueRetry}>
                            <Translation id="TR_TRY_AGAIN" />
                        </Banner.Button>
                    }
                />
            ) : (
                <Card type="contrast" paddingType="small">
                    <Row justifyContent="space-between" alignItems="center" width="100%" gap={8}>
                        <Text typographyStyle="body-md">
                            <Translation id="TR_EARN_YIELD_WRAP_RECEIVING" />
                        </Text>
                        <Column alignItems="flex-end" gap={2}>
                            <Text typographyStyle="body-md" align="end">
                                <Translation
                                    id="TR_EARN_LIDO_WITHDRAWAL_NFT_COUNT"
                                    values={{ count: Math.max(withdrawalAmounts.length, 1) }}
                                />
                            </Text>
                            {isAmountValid && (
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                    align="end"
                                    data-testid="@staking/lido-unstake/payout-amount"
                                >
                                    <Translation
                                        id="TR_EARN_LIDO_WITHDRAWAL_NFT_ESTIMATED_VALUE"
                                        values={{
                                            amount: (
                                                <FormattedCryptoAmount
                                                    value={new BigNumber(
                                                        convertWstETHToETH({
                                                            wstETHAmount,
                                                            wstETHValue,
                                                        }),
                                                    )
                                                        .shiftedBy(-decimals)
                                                        .toFixed()}
                                                    networkSymbol={account.symbol}
                                                    showApproximation
                                                    isCompact
                                                />
                                            ),
                                        }}
                                    />
                                </Text>
                            )}
                        </Column>
                    </Row>
                </Card>
            )}
        </Column>
    );

    const { formState } = methods;

    return (
        <Form form={methods} formState={formState}>
            <Column gap={16}>
                <YieldFlowStepList
                    sequence={LIDO_WITHDRAWAL_STEPS}
                    currentStep={currentStep}
                    hasStepList
                    steps={{
                        approve: {
                            title: <Translation id="TR_EARN_LIDO_UNSTAKE_APPROVE_STEP" />,
                            testId: '@staking/lido-unstake/approve-step',
                            content: () => {
                                if (approval.pendingTxid !== null) {
                                    return (
                                        <Column gap={16} width="100%">
                                            {amountForm}
                                            <YieldPendingTransaction
                                                pendingTransaction={{
                                                    type: 'approve',
                                                    txid: approval.pendingTxid,
                                                    amount: approval.broadcast?.amount ?? '',
                                                }}
                                                onTxClick={approval.openTxDetail}
                                                showTimeEstimate={false}
                                            />
                                        </Column>
                                    );
                                }

                                return (
                                    <Column gap={16} width="100%">
                                        {amountForm}
                                        {isAllowanceError ? (
                                            <Banner
                                                intent="warning"
                                                data-testid="@staking/lido-unstake/allowance-unknown"
                                                description={
                                                    <Translation id="TR_EARN_LIDO_ALLOWANCE_UNKNOWN" />
                                                }
                                                rightContent={
                                                    <Banner.Button
                                                        onClick={() => void refetchAllowance()}
                                                        isLoading={isAllowanceFetching}
                                                    >
                                                        <Translation id="TR_TRY_AGAIN" />
                                                    </Banner.Button>
                                                }
                                            />
                                        ) : (
                                            <Button
                                                size="large"
                                                width="100%"
                                                onClick={handleApprove}
                                                isLoading={approval.isSubmitting}
                                                isDisabled={
                                                    !isAmountValid ||
                                                    hasPendingTransaction ||
                                                    !isAllowanceKnown ||
                                                    isAllowanceFetching
                                                }
                                                data-testid="@staking/lido-unstake/approve-button"
                                            >
                                                <Translation id="TR_EARN_LIDO_UNSTAKE_APPROVE_STEP" />
                                            </Button>
                                        )}
                                    </Column>
                                );
                            },
                        },
                        action: {
                            title: <Translation id="TR_EARN_LIDO_UNSTAKE_REQUEST_SUBMIT" />,
                            testId: '@staking/lido-unstake/request-step',
                            content: () => (
                                <Column gap={16} width="100%">
                                    {amountForm}
                                    {request.pendingTxid !== null ? (
                                        <YieldPendingTransaction
                                            pendingTransaction={{
                                                type: 'withdraw',
                                                txid: request.pendingTxid,
                                                amount: request.broadcast?.amount ?? '',
                                            }}
                                            onTxClick={request.openTxDetail}
                                            showTimeEstimate={false}
                                            titleId="TR_EARN_LIDO_PENDING_WITHDRAWAL_REQUEST"
                                        />
                                    ) : (
                                        <Button
                                            size="large"
                                            width="100%"
                                            onClick={handleRequest}
                                            isLoading={request.isSubmitting}
                                            isDisabled={!isAmountValid || hasPendingTransaction}
                                            data-testid="@staking/lido-unstake/request-button"
                                        >
                                            <Translation id="TR_EARN_LIDO_UNSTAKE_REQUEST_SUBMIT" />
                                        </Button>
                                    )}
                                </Column>
                            ),
                        },
                    }}
                />
            </Column>
        </Form>
    );
};
