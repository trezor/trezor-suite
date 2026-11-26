import { type ReactNode, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { AssetSymbol } from '@suite/assets';
import { TrezorLink } from '@suite/external-links';
import { Form } from '@suite/form';
import { Translation } from '@suite/intl';
import {
    selectStakingProductDescriptor,
    useRefreshStakingProductInfo,
} from '@suite-common/earn-staking';
import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type LidoStakeAmountIssue,
    type YieldFlowDisplayToken,
    type YieldFlowFormValues,
    buildLidoStakeTransaction,
    convertETHToWstETH,
    fetchLidoStakeLimit,
    getLidoMaxStakeAmount,
    getLidoStakeAmountIssue,
    getLidoStakeReceivedAmount,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Button, Column, Text } from '@trezor/components';
import { LIDO_TERMS_OF_USE_URL } from '@trezor/urls';
import { BigNumber } from '@trezor/utils';

import { EarnAmountCard } from '#src/components/earn/common/EarnAmountCard';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useSelector } from '#src/hooks/suite/useSelector';

import { LidoFlowComplete } from './LidoFlowComplete';
import { LidoStakingInfoModal } from './LidoStakingInfoModal';
import { useLidoStaking } from './useLidoStaking';
import { useLidoTransaction } from './useLidoTransaction';
import { useNavigateToLidoRoute } from './useNavigateToLidoRoute';
import { EarnProviderConsentModalLayout } from '../../modals/EarnProviderConsent/components/EarnProviderConsentModalLayout';
import { YieldFlowTransferRow } from '../../yield/common/YieldFlowTransferRow';
import { YieldPendingTransaction } from '../../yield/common/YieldPendingTransaction';
import { YieldReceivingRow } from '../../yield/common/YieldReceivingRow';

type LidoStakeProps = {
    account: Account;
};

export const LidoStake = ({ account }: LidoStakeProps) => {
    useRefreshStakingProductInfo();

    const { deployment, productId, wstETHToken, wstETHValue } = useLidoStaking(account);
    const limits = useSelector(state => selectStakingProductDescriptor(state, productId)?.limits);
    const transaction = useLidoTransaction({ account, kind: 'stake' });
    const navigateToLidoRoute = useNavigateToLidoRoute(account);
    const [onboarding, setOnboarding] = useState<'info' | 'terms' | 'complete'>('info');
    const closeOnboarding = () => navigateToLidoRoute('earn-lido');

    const methods = useForm<YieldFlowFormValues>({
        mode: 'onChange',
        defaultValues: { amountInput: '', fiatInput: '' },
    });
    const amountInput = useWatch({ control: methods.control, name: 'amountInput' });

    // What Lido takes right now only tightens the bounds: while it is not read the stake is held
    // to the ceiling of the product, and the chain refuses one over the limit when it is composed.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- cache identity is account.key; the queryFn passes the full account for its backend identity, and the deployment follows from the account's network
    const { data: stakeLimit = null } = useQuery({
        queryKey: commonQueryKeys.lidoStakeLimit(account.key),
        queryFn: () => (deployment === null ? null : fetchLidoStakeLimit({ account, deployment })),
        enabled: deployment !== null,
    });

    const { decimals } = getNetwork(account.symbol);
    const nativeToken: YieldFlowDisplayToken = {
        networkSymbol: account.symbol,
        symbol: getNetworkDisplaySymbol(account.symbol),
        decimals,
    };

    if (deployment === null || wstETHToken === null || limits === undefined) {
        return (
            <Banner intent="warning" description={<Translation id="TR_EARN_LIDO_UNAVAILABLE" />} />
        );
    }

    const displaySymbol = <AssetSymbol networkSymbol={account.symbol} />;

    if (transaction.broadcast && transaction.isConfirmed) {
        const stakedAmount = transaction.broadcast.amount;
        // What the mined stake brought in. Until the account has its token transfers the amount
        // is worked out from the wstETH value and says so.
        const receivedAmount =
            transaction.transaction === null
                ? null
                : getLidoStakeReceivedAmount({ deployment, transaction: transaction.transaction });
        const estimatedAmount =
            wstETHValue === null || stakedAmount === ''
                ? null
                : convertETHToWstETH({
                      ethAmount: new BigNumber(stakedAmount)
                          .shiftedBy(decimals)
                          .integerValue(BigNumber.ROUND_DOWN)
                          .toFixed(0),
                      wstETHValue,
                  });
        const outputAmount = receivedAmount ?? estimatedAmount;
        // A stake found pending on the account, staked before the flow was reopened, has no
        // entered amount to show.
        const transferRow =
            stakedAmount === '' || outputAmount === null ? undefined : (
                <YieldFlowTransferRow
                    isOutputCompact
                    inputLabelId="TR_EARN_LIDO_STAKE_AMOUNT"
                    outputLabelId={
                        receivedAmount === null ? 'TR_EARN_LIDO_STAKE_RECEIVING' : 'TR_RECEIVED'
                    }
                    input={{ token: nativeToken, amount: stakedAmount }}
                    output={{
                        token: wstETHToken,
                        amount: new BigNumber(outputAmount)
                            .shiftedBy(-wstETHToken.decimals)
                            .toFixed(),
                    }}
                />
            );

        return (
            <LidoFlowComplete
                account={account}
                kind="stake"
                heading={<Translation id="TR_EARN_LIDO_STAKE_COMPLETE" />}
                description={
                    <Translation
                        id="TR_EARN_LIDO_STAKE_COMPLETE_DESCRIPTION"
                        values={{ displaySymbol }}
                    />
                }
            >
                {transferRow}
            </LidoFlowComplete>
        );
    }

    const amount = new BigNumber(amountInput || 0);
    const ethAmount = amount.shiftedBy(decimals).integerValue(BigNumber.ROUND_DOWN).toFixed(0);

    // One set of bounds for the Max button and for a typed amount. The fee of the stake itself
    // is checked against the balance by the fee review, with the stake as the transaction value.
    const stakeBounds = {
        availableBalance: account.availableBalance,
        feeBufferBalance: limits.feeBufferBalance,
        maxStakeAmount: limits.maxStakeAmount,
        stakeLimit,
    };
    const maxAmount = new BigNumber(getLidoMaxStakeAmount(stakeBounds))
        .shiftedBy(-decimals)
        .toFixed();
    const amountIssue = getLidoStakeAmountIssue({ ethAmount, ...stakeBounds });
    const isAmountValid = amount.gt(0) && amountIssue === null && methods.formState.isValid;

    const warningByAmountIssue: Record<LidoStakeAmountIssue, ReactNode> = {
        'insufficient-balance': <Translation id="TR_NOT_ENOUGH_FUNDS" />,
        'fee-reserve': (
            <Translation
                id="AMOUNT_NOT_ENOUGH_CURRENCY_FEE"
                values={{ networkDisplaySymbol: displaySymbol }}
            />
        ),
        'staking-paused': <Translation id="TR_EARN_LIDO_STAKE_PAUSED" />,
        'stake-limit': (
            <Translation
                id="AMOUNT_EXCEEDS_MAX"
                values={{
                    maxAmount: (
                        <FormattedCryptoAmount value={maxAmount} networkSymbol={account.symbol} />
                    ),
                }}
            />
        ),
    };

    const receivingAmount =
        wstETHValue === null
            ? null
            : new BigNumber(convertETHToWstETH({ ethAmount, wstETHValue }))
                  .shiftedBy(-wstETHToken.decimals)
                  .toFixed();

    const handleSubmit = methods.handleSubmit(() => {
        if (amountIssue !== null || onboarding !== 'complete') {
            return;
        }

        const stakeTransaction = buildLidoStakeTransaction({ deployment, ethAmount });

        if (stakeTransaction === null) {
            return;
        }

        return transaction.submit({
            transaction: stakeTransaction,
            amount: amount.toFixed(),
            token: nativeToken,
        });
    });

    const { formState } = methods;
    const hasPendingTransaction = transaction.pendingTxid !== null;

    return (
        <>
            {!hasPendingTransaction && onboarding === 'info' && (
                <LidoStakingInfoModal
                    account={account}
                    onClose={closeOnboarding}
                    onContinue={() => setOnboarding('terms')}
                />
            )}

            {!hasPendingTransaction && onboarding === 'terms' && (
                <EarnProviderConsentModalLayout
                    heading={
                        <Translation id="TR_EARN_LIDO_STAKE_SUBMIT" values={{ displaySymbol }} />
                    }
                    banners={
                        <Banner
                            intent="info"
                            description={<Translation id="TR_EARN_LIDO_CONSENT_RISKS" />}
                        />
                    }
                    consentText={
                        <Translation
                            id="TR_EARN_LIDO_CONSENT_TERMS"
                            values={{
                                a: chunks => (
                                    <TrezorLink href={LIDO_TERMS_OF_USE_URL}>{chunks}</TrezorLink>
                                ),
                            }}
                        />
                    }
                    onConfirm={() => setOnboarding('complete')}
                    onCancel={closeOnboarding}
                />
            )}

            <Text typographyStyle="headline-md" data-testid="@staking/lido-stake/title">
                <Translation id="TR_EARN_LIDO_STAKE_SUBMIT" values={{ displaySymbol }} />
            </Text>

            <Form form={methods} formState={formState}>
                <Column gap={16}>
                    <EarnAmountCard
                        testIdPrefix="@staking/lido-stake"
                        tokenSymbol={displaySymbol}
                        decimals={decimals}
                        isDisabled={hasPendingTransaction}
                        approxFiat={{ symbol: account.symbol }}
                        heading={{ amountLabelTranslationId: 'TR_EARN_LIDO_STAKE_AMOUNT' }}
                        summary={{
                            labelTranslationId: 'TR_EARN_LIDO_STAKE_AVAILABLE',
                            value: (
                                <FormattedCryptoAmount
                                    value={account.formattedBalance}
                                    networkSymbol={account.symbol}
                                />
                            ),
                            onMaxClick: hasPendingTransaction
                                ? undefined
                                : () =>
                                      methods.setValue('amountInput', maxAmount, {
                                          shouldValidate: true,
                                      }),
                        }}
                        warning={
                            amountIssue === null ? undefined : (
                                <Banner
                                    intent="warning"
                                    data-testid={`@staking/lido-stake/amount-issue/${amountIssue}`}
                                    description={warningByAmountIssue[amountIssue]}
                                />
                            )
                        }
                    />

                    <YieldReceivingRow
                        token={wstETHToken}
                        amount={receivingAmount}
                        testId="@staking/lido-stake/receiving-amount"
                    />

                    <Button
                        size="large"
                        width="100%"
                        onClick={handleSubmit}
                        isLoading={transaction.isSubmitting}
                        isDisabled={
                            !isAmountValid || hasPendingTransaction || onboarding !== 'complete'
                        }
                        data-testid="@staking/lido-stake/submit-button"
                    >
                        <Translation id="TR_EARN_LIDO_STAKE_SUBMIT" values={{ displaySymbol }} />
                    </Button>

                    {transaction.pendingTxid !== null && (
                        <YieldPendingTransaction
                            pendingTransaction={{
                                type: 'deposit',
                                txid: transaction.pendingTxid,
                                amount: transaction.broadcast?.amount ?? '',
                            }}
                            onTxClick={transaction.openTxDetail}
                            titleId="TR_EARN_LIDO_PENDING_STAKE"
                        />
                    )}
                </Column>
            </Form>
        </>
    );
};
