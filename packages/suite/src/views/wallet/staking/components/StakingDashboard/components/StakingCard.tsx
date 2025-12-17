import { EventType } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { getStakingTotalRewards } from '@suite-common/staking';
import { StakingFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
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
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { openModal } from 'src/actions/suite/modalActions';
import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useLegacyAnalytics } from 'src/support/useAnalytics';

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
                    typographyStyle="titleSmall"
                    variant={isReward ? 'primary' : 'default'}
                >
                    {title}
                </Paragraph>
                <Paragraph typographyStyle="hint" variant="tertiary">
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
    const legacyAnalytics = useLegacyAnalytics();
    const { isBelowLaptop } = useLayoutSize();

    const selectedStakingTotalRewards = useSelector(state =>
        selectStakingTotalRewards(state, account?.symbol, account.descriptor),
    );
    const cardanoStakingPools = useSelector(selectCardanoPoolsInfo);

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

    const dispatch = useDispatch();

    const openStakeModal = () => {
        if (!isStakingDisabled) {
            dispatch(openModal({ type: 'stake', flow: StakingFlow.Stake }));

            legacyAnalytics.report({
                type: EventType.StakingStake,
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
            dispatch(openModal({ type: 'claim' }));

            legacyAnalytics.report({
                type: EventType.StakingClaim,
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
            dispatch(openModal({ type: 'unstake' }));

            legacyAnalytics.report({
                type: EventType.StakingUnstake,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: account.symbol,
                },
            });
        }
    };

    const isCardanoNetworkType = account.networkType === 'cardano';

    return (
        <Card data-testid="@wallet/staking/card">
            <Column flex="1" gap={spacings.xxl}>
                {shouldShowProgressLabels && <ProgressLabels labels={progressLabelsData} />}

                <Grid columns={isBelowLaptop ? 1 : 2} gap={spacings.xxl}>
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
                            <Row gap={spacings.xs}>
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
                                                        ? 'TR_STAKE_APPROXIMATE_DAYS'
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

                <Row margin={{ top: 'auto' }} gap={spacings.xs}>
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
                </Row>
            </Column>
        </Card>
    );
};
