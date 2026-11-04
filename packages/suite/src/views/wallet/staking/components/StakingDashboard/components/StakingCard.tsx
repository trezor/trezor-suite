import { events, injectDesktopAnalytics } from '@suite/analytics';
import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import {
    formatStakingAmount,
    isStakingOperationAvailable,
    selectHasStakingAccountWarning,
    selectIsStakingAccountStakedWithOfferedProvider,
    selectIsStakingOperationPending,
    useStakingAccountPosition,
} from '@suite-common/earn-staking';
import {
    type StakingAmount,
    type StakingOperation,
    ZERO_STAKING_AMOUNT,
    getStakingPositionPrincipal,
} from '@suite-common/earn-staking-common';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { selectAccountStakeTypeTransactions, stakeActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import {
    Badge,
    Button,
    Card,
    Column,
    Grid,
    type IconComponent,
    InfoItem,
    Paragraph,
    Row,
    Skeleton,
    Tooltip,
} from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CheckIcon, InfoIcon, LockIcon, PlusCircleIcon, SpinnerGapIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useStakingOperationSwitch } from '#src/hooks/earn/useStakingOperationSwitch';
import { useStakingTotalRewards } from '#src/hooks/earn/useStakingTotalRewards';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';
import { useSelector } from '#src/hooks/suite/useSelector';

import { useIsTxStatusShown } from '../hooks/useIsTxStatusShown';
import { useProgressLabelsData } from '../hooks/useProgressLabelsData';
import { ProgressLabels } from './ProgressLabels/ProgressLabels';

type ItemProps = {
    label: React.ReactNode;
    icon: IconComponent;
    title: React.ReactNode;
    description: React.ReactNode;
    isReward?: boolean;
    isLoading?: boolean;
    'data-testid'?: string;
};

const Item = ({
    label,
    icon,
    isReward = false,
    isLoading = false,
    title,
    description,
    'data-testid': dataTestId,
}: ItemProps) => (
    <InfoItem label={label} icon={icon}>
        {isLoading ? (
            <>
                <Skeleton width={150} height={32} animate />
                <Skeleton width={50} height={18} animate />
            </>
        ) : (
            <>
                <Paragraph
                    data-testid={dataTestId}
                    typographyStyle="headline-sm"
                    intent={isReward ? 'brand' : 'neutral'}
                >
                    {title}
                </Paragraph>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {description}
                </Paragraph>
            </>
        )}
    </InfoItem>
);

type StakingCardProps = {
    account: Account;
    daysToAddToPool?: number | null;
    daysToUnstake?: number | null;
};

export const StakingCard = ({
    account,
    daysToAddToPool = null,
    daysToUnstake = null,
}: StakingCardProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { isBelowLaptop } = useLayoutSize();

    const { productId, descriptor, position, totals, access } = useStakingAccountPosition(
        account.key,
    );
    const isDrepDelegationRequired = useSelector(state =>
        selectHasStakingAccountWarning(state, account.key, 'missing-drep'),
    );
    // A pending delegation has yet to stake the balance.
    const hasNoPool = useSelector(state =>
        selectHasStakingAccountWarning(state, account.key, 'no-stake-pool'),
    );
    const isStakedWithProvider = useSelector(state =>
        selectIsStakingAccountStakedWithOfferedProvider(state, account.key),
    );
    const hasPendingOperation = useSelector(state =>
        selectIsStakingOperationPending(state, account.key),
    );

    const stakeTxs = useSelector(state => selectAccountStakeTypeTransactions(state, account.key));

    const { totalRewards, isTotalRewardsLoading } = useStakingTotalRewards(account);

    const { message: stakingMessageContent } = useStakingOperationSwitch(productId, 'stake');
    const { message: unstakingMessageContent } = useStakingOperationSwitch(productId, 'unstake');
    const { message: claimingMessageContent } = useStakingOperationSwitch(productId, 'claim');
    const { message: votingMessageContent } = useStakingOperationSwitch(productId, 'vote');

    const isAvailable = (operation: StakingOperation) =>
        isStakingOperationAvailable({ position, access, operation });

    const isWithheld = (operation: StakingOperation) => access.disabled[operation] !== undefined;

    const formatAmount = (amount: StakingAmount) =>
        formatStakingAmount({ amount, networkSymbol: account.symbol });

    const principal =
        position === null || descriptor === null
            ? ZERO_STAKING_AMOUNT
            : getStakingPositionPrincipal(position, descriptor.rewardsKind);
    const depositedBalance = formatAmount(principal);
    const totalPendingStakeBalance = formatAmount(totals.pending);
    const unstakingBalance = formatAmount(totals.unstaking);

    const isCardanoNetworkType = account.networkType === 'cardano';

    // A registered Cardano key reports no pending balance; legacy read a delegation as activating
    // until its first reward, which keeps the timeline on the tab until then.
    const isCardanoActivating =
        isCardanoNetworkType && isStakedWithProvider && !isPositiveBalance(totals.rewards);

    const isStakePending = isPositiveBalance(totalPendingStakeBalance) || isCardanoActivating;
    const isPendingUnstakeShown = isPositiveBalance(unstakingBalance);

    const { isTxStatusShown } = useIsTxStatusShown(
        new BigNumber(isCardanoActivating ? depositedBalance : totalPendingStakeBalance),
        account.descriptor,
    );

    const isDaysToUnstakeShown = daysToUnstake !== null;

    // A pending Solana stake-type tx is only the stand-in kept until the backend reports it; it
    // does not lock unstaking or reward claims the way an unconfirmed Ethereum stake does.
    const isStakeConfirming = account.networkType !== 'solana' && hasPendingOperation;

    const isStakingDisabled = !isAvailable('stake');
    const isUnstakeDisabled = !isAvailable('unstake');
    const isClaimDisabled = !isAvailable('claim');
    const isChangeDelegateDisabled = !isAvailable('vote') || isStakeConfirming;

    const progressLabelsData = useProgressLabelsData({
        daysToAddToPool,
        isStakeConfirming,
        isStakePending,
        account,
        position,
        stakeTxs,
        isStakedWithProvider,
    });

    const shouldShowProgressLabels =
        (isStakeConfirming || isTxStatusShown) && !!progressLabelsData.length;

    const drepDelegationRequiredMessage = isDrepDelegationRequired ? (
        <Translation id="TR_STAKE_DREP_DELEGATION_REQUIRED" />
    ) : undefined;

    const openStakeModal = () => {
        if (isStakingDisabled) return;

        dispatch(
            openModal({
                type: 'earn-in-a-nutshell',
                flow: EarnFlow.Stake,
                provider: EarnProvider.Everstake,
                account,
                analyticsStep: 'staking-dashboard',
            }),
        );
    };

    const openClaimModal = () => {
        if (isClaimDisabled) return;

        dispatch(openModal({ type: 'claim', account }));

        analytics.report({
            type: events.stakingClaimEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    const openUnstakeModal = () => {
        if (isUnstakeDisabled) return;

        dispatch(openModal({ type: 'unstake', accountKey: account.key }));

        analytics.report({
            type: events.stakingUnstakeEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    const openChangeDelegateModal = () => {
        if (!isCardanoNetworkType || isChangeDelegateDisabled) return;

        dispatch(
            stakeActions.setAccountVotingDelegation({
                accountKey: account.key,
                option: { type: 'current' },
            }),
        );
        dispatch(openModal({ type: 'change-delegate' }));

        analytics.report({
            type: events.stakingChangeDelegateEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <Card data-testid="@wallet/staking/card">
            <Column flex="1" gap={32}>
                {shouldShowProgressLabels && <ProgressLabels labels={progressLabelsData} />}

                <Grid columns={isBelowLaptop ? 1 : 2} gap={32}>
                    {isStakePending && !isCardanoNetworkType && (
                        <Item
                            label={<Translation id="TR_STAKE_TOTAL_PENDING" />}
                            icon={SpinnerGapIcon}
                            title={
                                <FormattedCryptoAmount
                                    data-testid="@account/staking/pending"
                                    value={totalPendingStakeBalance}
                                    networkSymbol={account.symbol}
                                />
                            }
                            description={
                                <BaseCurrencyValue
                                    amount={totalPendingStakeBalance}
                                    symbol={account.symbol}
                                    showApproximationIndicator
                                />
                            }
                        />
                    )}

                    {isCardanoNetworkType && !hasNoPool && (
                        <Item
                            label={<Translation id="TR_STAKE_STAKED_AUTOMATICALLY" />}
                            icon={CheckIcon}
                            title={<Translation id="TR_STAKE_FULL_BALANCE" />}
                            description={
                                <Translation
                                    id="TR_STAKE_FUNDS_FULLY_ACCESSIBLE"
                                    values={{
                                        networkDisplaySymbol: (
                                            <AssetSymbol networkSymbol={account.symbol} />
                                        ),
                                    }}
                                />
                            }
                            data-testid="@account/staking/full-balance"
                        />
                    )}

                    {!isCardanoNetworkType && (
                        <Item
                            label={<Translation id="TR_STAKE_STAKED" />}
                            icon={LockIcon}
                            title={
                                <FormattedCryptoAmount
                                    data-testid="@account/staking/staked"
                                    value={depositedBalance}
                                    networkSymbol={account.symbol}
                                />
                            }
                            description={
                                <BaseCurrencyValue
                                    amount={depositedBalance}
                                    symbol={account.symbol}
                                    showApproximationIndicator
                                />
                            }
                        />
                    )}

                    <Item
                        label={
                            <Row gap={8}>
                                <Translation
                                    id={
                                        account.networkType === 'solana'
                                            ? 'TR_STAKE_TOTAL_REWARDS'
                                            : 'TR_STAKE_REWARDS'
                                    }
                                />
                                {!hasNoPool && (
                                    <Tooltip
                                        maxWidth={250}
                                        content={
                                            <Translation
                                                id="TR_STAKE_ETH_REWARDS_EARN_APY"
                                                values={{
                                                    networkDisplaySymbol: (
                                                        <AssetSymbol
                                                            networkSymbol={account.symbol}
                                                        />
                                                    ),
                                                }}
                                            />
                                        }
                                    >
                                        <Badge intent="brand" iconRight={InfoIcon} size="small">
                                            <Translation id="TR_STAKE_RESTAKED_BADGE" />
                                        </Badge>
                                    </Tooltip>
                                )}
                            </Row>
                        }
                        icon={PlusCircleIcon}
                        isReward
                        title={
                            <FormattedCryptoAmount
                                data-testid="@account/staking/rewards"
                                value={totalRewards}
                                networkSymbol={account.symbol}
                            />
                        }
                        description={
                            <BaseCurrencyValue
                                amount={totalRewards}
                                symbol={account.symbol}
                                showApproximationIndicator
                            />
                        }
                        isLoading={isTotalRewardsLoading}
                    />
                    {isPendingUnstakeShown && (
                        <Item
                            label={
                                <>
                                    <Translation id="TR_STAKE_UNSTAKING" />{' '}
                                    {isDaysToUnstakeShown && (
                                        <>
                                            (
                                            <Translation
                                                id={
                                                    account.networkType === 'ethereum'
                                                        ? 'TR_EARN_APPROXIMATE_DAYS'
                                                        : 'TR_UP_TO_DAYS'
                                                }
                                                values={{ count: daysToUnstake }}
                                            />
                                            )
                                        </>
                                    )}
                                </>
                            }
                            icon={SpinnerGapIcon}
                            title={
                                <FormattedCryptoAmount
                                    data-testid="@account/staking/unstaking"
                                    value={unstakingBalance}
                                    networkSymbol={account.symbol}
                                />
                            }
                            description={
                                <BaseCurrencyValue
                                    amount={unstakingBalance}
                                    symbol={account.symbol}
                                    showApproximationIndicator
                                />
                            }
                        />
                    )}
                </Grid>

                <Row margin={{ top: 'auto' }} gap={8}>
                    {!isCardanoNetworkType ? (
                        <Tooltip content={stakingMessageContent}>
                            <Button
                                onClick={openStakeModal}
                                isDisabled={isStakingDisabled}
                                iconLeft={isWithheld('stake') ? InfoIcon : undefined}
                                intent="neutral"
                                priority="secondary"
                                data-testid="@account/staking/stake-more-button"
                            >
                                <Translation id="TR_STAKE_STAKE_MORE" />
                            </Button>
                        </Tooltip>
                    ) : (
                        <Tooltip content={claimingMessageContent ?? drepDelegationRequiredMessage}>
                            <Button
                                onClick={openClaimModal}
                                isDisabled={isClaimDisabled}
                                iconLeft={
                                    isWithheld('claim') || isDrepDelegationRequired
                                        ? InfoIcon
                                        : undefined
                                }
                                intent={isClaimDisabled ? 'neutral' : 'brand'}
                                priority={isClaimDisabled ? 'secondary' : 'primary'}
                                data-testid="@account/staking/claim-rewards-button"
                            >
                                <Translation id="TR_EARN_CLAIM_REWARDS" />
                            </Button>
                        </Tooltip>
                    )}
                    <Tooltip content={unstakingMessageContent ?? drepDelegationRequiredMessage}>
                        <Button
                            isDisabled={isUnstakeDisabled}
                            onClick={openUnstakeModal}
                            iconLeft={
                                isWithheld('unstake') || isDrepDelegationRequired
                                    ? InfoIcon
                                    : undefined
                            }
                            intent="neutral"
                            priority="secondary"
                            data-testid="@account/staking/unstake-button"
                        >
                            <Translation
                                id={
                                    isCardanoNetworkType
                                        ? 'TR_STAKE_UNSTAKE'
                                        : 'TR_STAKE_UNSTAKE_TO_CLAIM'
                                }
                            />
                        </Button>
                    </Tooltip>
                    {isCardanoNetworkType && (
                        <Tooltip content={votingMessageContent}>
                            <Button
                                onClick={openChangeDelegateModal}
                                isDisabled={isChangeDelegateDisabled}
                                iconLeft={isWithheld('vote') ? InfoIcon : undefined}
                                intent={isDrepDelegationRequired ? 'brand' : 'neutral'}
                                priority={isDrepDelegationRequired ? 'primary' : 'secondary'}
                                data-testid="@account/staking/change-delegate-button"
                            >
                                <Translation id="TR_STAKE_CHANGE_DELEGATE" />
                            </Button>
                        </Tooltip>
                    )}
                </Row>
            </Column>
        </Card>
    );
};
