import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import { useSolanaRewardsTotal } from '@suite-common/earn-staking-api/src/staking';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    selectAccountIsStakingActive,
    selectAccountStakeTypeTransactions,
    selectCardanoPoolsInfo,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    getStakingDataForNetwork,
    isCardanoStakedWithEverstake,
    isPending,
} from '@suite-common/wallet-utils';
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
import { CheckIcon, InfoIcon, LockIcon, PlusCircleIcon, SpinnerGapIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { useIsTxStatusShown } from '../hooks/useIsTxStatusShown';
import { useProgressLabelsData } from '../hooks/useProgressLabelsData';
import { ProgressLabels } from './ProgressLabels/ProgressLabels';
import { getStakingTotalRewards } from './utils/stakingTotalRewards';

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
    isValidatorsQueueLoading?: boolean;
    daysToAddToPool?: number;
    daysToUnstake?: number;
    account: Account;
};

export const StakingCard = ({
    isValidatorsQueueLoading,
    daysToAddToPool,
    daysToUnstake,
    account,
}: StakingCardProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { isBelowLaptop } = useLayoutSize();

    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);
    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));

    const solanaRewardsTotalQuery = useSolanaRewardsTotal(account);
    const { totalRewards, isTotalRewardsLoading } = getStakingTotalRewards(
        account,
        solanaRewardsTotalQuery,
    );

    const {
        isStakingDisabled,
        isUnstakingDisabled,
        isClaimingDisabled,
        isVotingDisabled,
        stakingMessageContent,
        unstakingMessageContent,
        claimingMessageContent,
        votingMessageContent,
    } = useMessageSystemStaking(account.symbol);

    const {
        autocompoundBalance = '0',
        depositedBalance = '0',
        totalPendingStakeBalance = '0',
        withdrawTotalAmount = '0',
        claimableAmount = '0',
        restakedReward = '0',
    } = getStakingDataForNetwork(account) ?? {};

    const isUnstakePending = new BigNumber(withdrawTotalAmount).gt(0);

    const { isTxStatusShown } = useIsTxStatusShown(
        new BigNumber(totalPendingStakeBalance),
        account.descriptor,
    );

    const isDaysToAddToPoolShown = daysToAddToPool !== undefined && !isValidatorsQueueLoading;
    const isPendingUnstakeShown =
        isUnstakePending && !new BigNumber(withdrawTotalAmount).eq(claimableAmount);
    const isDaysToUnstakeShown = daysToUnstake !== undefined && !isValidatorsQueueLoading;

    const stakeTxs = useSelector(state =>
        selectAccountStakeTypeTransactions(state, account.key || ''),
    );
    const isStakeConfirming = stakeTxs.some(tx => isPending(tx));

    const canUnstake = new BigNumber(autocompoundBalance).gt(0) && !isStakeConfirming;
    const canClaimRewards = new BigNumber(restakedReward).gt(0) && !isStakeConfirming;
    const isStakePending = new BigNumber(totalPendingStakeBalance).gt(0);

    const isStakedWithEverstake = isCardanoStakedWithEverstake(account, cardanoStakingPools);

    const progressLabelsData = useProgressLabelsData({
        daysToAddToPool,
        isDaysToAddToPoolShown,
        isStakeConfirming,
        isStakePending,
        account,
        stakeTxs,
        isStakedWithEverstake,
    });

    const shouldShowProgressLabels =
        (isStakeConfirming || isTxStatusShown) && !!progressLabelsData.length;

    const isCardanoNetworkType = account.networkType === 'cardano';

    const dispatch = useDispatch();

    const openStakeModal = () => {
        if (!isStakingDisabled) {
            dispatch(
                openModal({
                    type: 'stake',
                    flow: EarnFlow.Stake,
                    account,
                }),
            );

            analytics.report({
                type: events.stakingStakeEvent.name,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: account.symbol,
                },
            });
        }
    };

    const openClaimModal = () => {
        if (canClaimRewards && !isClaimingDisabled) {
            dispatch(openModal({ type: 'claim', account }));

            analytics.report({
                type: events.stakingClaimEvent.name,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: account.symbol,
                },
            });
        }
    };

    const openUnstakeModal = () => {
        if (!isUnstakingDisabled) {
            dispatch(openModal({ type: 'unstake', account }));

            analytics.report({
                type: events.stakingUnstakeEvent.name,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: account.symbol,
                },
            });
        }
    };

    const openChangeDelegateModal = () => {
        if (!isCardanoNetworkType || !isStakingActive || isStakeConfirming || isVotingDisabled)
            return;

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
                                    symbol={account.symbol}
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

                    {isCardanoNetworkType ? (
                        <Item
                            label={<Translation id="TR_STAKE_STAKED_AUTOMATICALLY" />}
                            icon={CheckIcon}
                            title={<Translation id="TR_STAKE_FULL_BALANCE" />}
                            description={
                                <Translation
                                    id="TR_STAKE_FUNDS_FULLY_ACCESSIBLE"
                                    values={{
                                        networkDisplaySymbol: getNetworkDisplaySymbol(
                                            account.symbol,
                                        ),
                                    }}
                                />
                            }
                            data-testid="@account/staking/full-balance"
                        />
                    ) : (
                        <Item
                            label={<Translation id="TR_STAKE_STAKE" />}
                            icon={LockIcon}
                            title={
                                <FormattedCryptoAmount
                                    data-testid="@account/staking/staked"
                                    value={depositedBalance || '0'}
                                    symbol={account.symbol}
                                />
                            }
                            description={
                                <BaseCurrencyValue
                                    amount={depositedBalance || '0'}
                                    symbol={account.symbol}
                                    showApproximationIndicator
                                />
                            }
                        />
                    )}

                    <Item
                        label={
                            <Row gap={8}>
                                <Translation id="TR_STAKE_REWARDS" />
                                <Tooltip
                                    maxWidth={250}
                                    content={
                                        <Translation
                                            id="TR_STAKE_ETH_REWARDS_EARN_APY"
                                            values={{
                                                networkDisplaySymbol: getNetworkDisplaySymbol(
                                                    account.symbol,
                                                ),
                                            }}
                                        />
                                    }
                                >
                                    {!isCardanoNetworkType && (
                                        <Badge intent="brand" iconRight={InfoIcon} size="small">
                                            <Translation id="TR_STAKE_RESTAKED_BADGE" />
                                        </Badge>
                                    )}
                                </Tooltip>
                            </Row>
                        }
                        icon={PlusCircleIcon}
                        isReward
                        title={
                            <FormattedCryptoAmount
                                data-testid="@account/staking/rewards"
                                value={totalRewards}
                                symbol={account.symbol}
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
                                    value={withdrawTotalAmount}
                                    symbol={account.symbol}
                                />
                            }
                            description={
                                <BaseCurrencyValue
                                    amount={withdrawTotalAmount}
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
                                iconLeft={isStakingDisabled ? InfoIcon : undefined}
                                intent="neutral"
                                priority="secondary"
                                data-testid="@account/staking/stake-more-button"
                            >
                                <Translation id="TR_STAKE_STAKE_MORE" />
                            </Button>
                        </Tooltip>
                    ) : (
                        <Tooltip content={claimingMessageContent}>
                            <Button
                                onClick={openClaimModal}
                                isDisabled={!canClaimRewards || isClaimingDisabled}
                                iconLeft={isClaimingDisabled ? InfoIcon : undefined}
                                intent="brand"
                                data-testid="@account/staking/claim-rewards-button"
                            >
                                <Translation id="TR_EARN_CLAIM_REWARDS" />
                            </Button>
                        </Tooltip>
                    )}
                    <Tooltip content={unstakingMessageContent}>
                        <Button
                            isDisabled={!canUnstake || isUnstakingDisabled}
                            onClick={openUnstakeModal}
                            iconLeft={isUnstakingDisabled ? InfoIcon : undefined}
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
                                isDisabled={
                                    !isStakingActive || isStakeConfirming || isVotingDisabled
                                }
                                iconLeft={isVotingDisabled ? InfoIcon : undefined}
                                intent="neutral"
                                priority="secondary"
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
