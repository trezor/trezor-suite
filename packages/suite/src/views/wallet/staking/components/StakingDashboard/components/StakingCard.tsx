import { getStakingTotalRewards } from '@suite-common/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    StakeRootState,
    selectAccountStakeTypeTransactions,
    selectStakingTotalRewards,
} from '@suite-common/wallet-core';
import {
    getStakingAccountCurrentStatus,
    getStakingDataForNetwork,
    isPending,
} from '@suite-common/wallet-utils';
import {
    Badge,
    Card,
    Column,
    Grid,
    Icon,
    IconName,
    InfoItem,
    NewButton,
    Paragraph,
    Row,
    SkeletonRectangle,
    Tooltip,
} from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { openModal } from 'src/actions/suite/modalActions';
import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { ProgressLabels } from './ProgressLabels/ProgressLabels';
import { useIsTxStatusShown } from '../hooks/useIsTxStatusShown';
import { useProgressLabelsData } from '../hooks/useProgressLabelsData';

type ItemProps = {
    label: React.ReactNode;
    iconName: IconName;
    title: React.ReactNode;
    description: React.ReactNode;
    isReward?: boolean;
    isLoading?: boolean;
};

const Item = ({
    label,
    iconName,
    isReward = false,
    isLoading = false,
    title,
    description,
}: ItemProps) => (
    <InfoItem label={label} iconName={iconName}>
        {isLoading ? (
            <>
                <SkeletonRectangle width="150px" height="32px" animate />
                <SkeletonRectangle width="50px" height="18px" animate />
            </>
        ) : (
            <>
                <Paragraph typographyStyle="titleSmall" variant={isReward ? 'primary' : 'default'}>
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
};

export const StakingCard = ({
    isValidatorsQueueLoading,
    daysToAddToPool,
    daysToUnstake,
}: StakingCardProps) => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const { isBelowLaptop } = useLayoutSize();

    const isEthereumNetworkType = selectedAccount?.networkType === 'ethereum';
    const isCardanoNetworkType = selectedAccount?.networkType === 'cardano';

    const selectedStakingTotalRewards = useSelector((state: StakeRootState) =>
        selectStakingTotalRewards(state, selectedAccount?.symbol, selectedAccount?.descriptor),
    );

    const { totalRewards = '0', isTotalRewardsLoading } = getStakingTotalRewards(
        selectedAccount,
        selectedStakingTotalRewards,
    );

    const {
        isStakingDisabled,
        isUnstakingDisabled,
        stakingMessageContent,
        unstakingMessageContent,
    } = useMessageSystemStaking(selectedAccount?.symbol);

    const {
        autocompoundBalance = '0',
        depositedBalance = '0',
        totalPendingStakeBalance = '0',
        withdrawTotalAmount = '0',
        claimableAmount = '0',
        restakedReward = '0',
    } = getStakingDataForNetwork(selectedAccount) ?? {};

    const canUnstake = new BigNumber(autocompoundBalance).gt(0);
    const canClaimRewards = new BigNumber(restakedReward).gt(0);
    const isStakePending = new BigNumber(totalPendingStakeBalance).gt(0);

    const isUnstakePending = new BigNumber(withdrawTotalAmount).gt(0);

    const { isTxStatusShown } = useIsTxStatusShown(
        new BigNumber(totalPendingStakeBalance),
        selectedAccount?.descriptor,
    );

    const isDaysToAddToPoolShown = daysToAddToPool !== undefined && !isValidatorsQueueLoading;
    const isPendingUnstakeShown =
        isUnstakePending && !new BigNumber(withdrawTotalAmount).eq(claimableAmount);
    const isDaysToUnstakeShown = daysToUnstake !== undefined && !isValidatorsQueueLoading;

    const stakeTxs = useSelector(state =>
        selectAccountStakeTypeTransactions(state, selectedAccount?.key || ''),
    );
    const isStakeConfirming = stakeTxs.some(tx => isPending(tx));
    const hasCardanoPendingTx = isCardanoNetworkType && isStakeConfirming;

    const solStakingAccountStatus = getStakingAccountCurrentStatus(selectedAccount);

    const progressLabelsData = useProgressLabelsData({
        daysToAddToPool,
        isDaysToAddToPoolShown,
        isStakeConfirming,
        isStakePending,
        selectedAccount,
        solStakingAccountStatus,
    });

    const dispatch = useDispatch();

    const openStakeModal = () => {
        if (!isStakingDisabled) {
            dispatch(openModal({ type: 'stake' }));

            analytics.report({
                type: EventType.StakingStake,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: selectedAccount?.symbol,
                },
            });
        }
    };

    const openClaimModal = () => {
        if (canClaimRewards) {
            dispatch(openModal({ type: 'claim' }));

            analytics.report({
                type: EventType.StakingClaim,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: selectedAccount?.symbol,
                },
            });
        }
    };

    const openUnstakeModal = () => {
        if (!isUnstakingDisabled) {
            dispatch(openModal({ type: 'unstake' }));

            analytics.report({
                type: EventType.StakingUnstake,
                payload: {
                    action: 'continue',
                    step: 'staking-dashboard',
                    networkSymbol: selectedAccount?.symbol,
                },
            });
        }
    };

    if (!selectedAccount?.symbol) {
        return null;
    }

    return (
        <Card data-testid="@wallet/staking/card">
            <Column flex="1" gap={spacings.xxl}>
                {(isStakeConfirming || isTxStatusShown) && (
                    <ProgressLabels labels={progressLabelsData} />
                )}

                <Grid columns={isBelowLaptop ? 1 : 2} gap={spacings.xxl}>
                    {isStakePending && !isCardanoNetworkType && (
                        <Item
                            label={<Translation id="TR_STAKE_TOTAL_PENDING" />}
                            iconName="spinnerGap"
                            title={
                                <FormattedCryptoAmount
                                    data-testid="@account/staking/pending"
                                    value={totalPendingStakeBalance}
                                    symbol={selectedAccount.symbol}
                                />
                            }
                            description={
                                <BaseCurrencyValue
                                    amount={totalPendingStakeBalance}
                                    symbol={selectedAccount.symbol}
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
                                            selectedAccount.symbol,
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
                                    symbol={selectedAccount.symbol}
                                />
                            }
                            description={
                                <BaseCurrencyValue
                                    amount={depositedBalance || '0'}
                                    symbol={selectedAccount.symbol}
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
                                                    selectedAccount.symbol,
                                                ),
                                            }}
                                        />
                                    }
                                >
                                    {!isCardanoNetworkType && (
                                        <Badge variant="primary" size="small">
                                            <Row gap={spacings.xxs} alignItems="center">
                                                <Translation id="TR_STAKE_RESTAKED_BADGE" />
                                                <Icon name="info" size="small" variant="primary" />
                                            </Row>
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
                                symbol={selectedAccount.symbol}
                            />
                        }
                        description={
                            <BaseCurrencyValue
                                amount={totalRewards}
                                symbol={selectedAccount.symbol}
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
                                                    isEthereumNetworkType
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
                                    symbol={selectedAccount.symbol}
                                />
                            }
                            description={
                                <BaseCurrencyValue
                                    amount={withdrawTotalAmount}
                                    symbol={selectedAccount.symbol}
                                    showApproximationIndicator
                                />
                            }
                        />
                    )}
                </Grid>

                <Row margin={{ top: 'auto' }} gap={spacings.xs}>
                    {!isCardanoNetworkType ? (
                        <Tooltip content={stakingMessageContent}>
                            <NewButton
                                onClick={openStakeModal}
                                isDisabled={isStakingDisabled}
                                iconLeft={isStakingDisabled ? 'info' : undefined}
                                intent="neutral"
                                priority="secondary"
                                data-testid="@account/staking/stake-more-button"
                            >
                                <Translation id="TR_STAKE_STAKE_MORE" />
                            </NewButton>
                        </Tooltip>
                    ) : (
                        <Button
                            onClick={openClaimModal}
                            isDisabled={!canClaimRewards}
                            variant="primary"
                        >
                            <Translation id="TR_STAKE_CLAIM_REWARDS" />
                        </Button>
                    )}
                    <Tooltip content={unstakingMessageContent}>
                        <NewButton
                            isDisabled={!canUnstake || isUnstakingDisabled || hasCardanoPendingTx}
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
                        </NewButton>
                    </Tooltip>
                </Row>
            </Column>
        </Card>
    );
};
