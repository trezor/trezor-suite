import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { getStakingTotalRewards } from '@suite-common/staking';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    selectAccountIsStakingActive,
    selectAccountStakeTypeTransactions,
    selectCardanoPoolsInfo,
    selectStakingTotalRewards,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
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
    IconName,
    InfoItem,
    Paragraph,
    Row,
    SkeletonRectangle,
    Tooltip,
} from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { openModal } from 'src/actions/suite/modalActions';
import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useAnalytics } from 'src/support/useAnalytics';

import { useIsTxStatusShown } from '../hooks/useIsTxStatusShown';
import { useProgressLabelsData } from '../hooks/useProgressLabelsData';
import { ProgressLabels } from './ProgressLabels/ProgressLabels';

type ItemProps = {
    label: React.ReactNode;
    iconName: IconName;
    title: React.ReactNode;
    description: React.ReactNode;
    isReward?: boolean;
    isLoading?: boolean;
    'data-testid'?: string;
};

const Item = ({
    label,
    iconName,
    isReward = false,
    isLoading = false,
    title,
    description,
    'data-testid': dataTestId,
}: ItemProps) => (
    <InfoItem label={label} iconName={iconName}>
        {isLoading ? (
            <>
                <SkeletonRectangle width="150px" height="32px" animate />
                <SkeletonRectangle width="50px" height="18px" animate />
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
    const analytics = useAnalytics();
    const { isBelowLaptop } = useLayoutSize();

    const selectedStakingTotalRewards = useSelector(state =>
        selectStakingTotalRewards(state, account?.symbol, account.descriptor),
    );
    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);
    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));

    const { totalRewards = '0', isTotalRewardsLoading } = getStakingTotalRewards(
        account,
        selectedStakingTotalRewards,
    );

    const {
        isStakingDisabled,
        isUnstakingDisabled,
        stakingMessageContent,
        unstakingMessageContent,
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
                    type: 'supply',
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
        if (canClaimRewards) {
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
            dispatch(openModal({ type: 'withdraw', account }));

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
        if (!isCardanoNetworkType || !isStakingActive || isStakeConfirming) return;

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
                            iconName="spinnerGap"
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
                            iconName="check"
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
                            iconName="lock"
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
                                        <Badge intent="brand" iconRight="info" size="small">
                                            <Translation id="TR_STAKE_RESTAKED_BADGE" />
                                        </Badge>
                                    )}
                                </Tooltip>
                            </Row>
                        }
                        iconName="plusCircle"
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
                            iconName="spinnerGap"
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
                                iconLeft={isStakingDisabled ? 'info' : undefined}
                                intent="neutral"
                                priority="secondary"
                                data-testid="@account/staking/stake-more-button"
                            >
                                <Translation id="TR_STAKE_STAKE_MORE" />
                            </Button>
                        </Tooltip>
                    ) : (
                        <Button
                            onClick={openClaimModal}
                            isDisabled={!canClaimRewards}
                            intent="brand"
                            data-testid="@account/staking/claim-rewards-button"
                        >
                            <Translation id="TR_STAKE_CLAIM_REWARDS" />
                        </Button>
                    )}
                    <Tooltip content={unstakingMessageContent}>
                        <Button
                            isDisabled={!canUnstake || isUnstakingDisabled}
                            onClick={openUnstakeModal}
                            iconLeft={isUnstakingDisabled ? 'info' : undefined}
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
                        <Button
                            onClick={openChangeDelegateModal}
                            isDisabled={!isStakingActive || isStakeConfirming}
                            intent="neutral"
                            priority="secondary"
                        >
                            <Translation id="TR_STAKE_CHANGE_DELEGATE" />
                        </Button>
                    )}
                </Row>
            </Column>
        </Card>
    );
};
