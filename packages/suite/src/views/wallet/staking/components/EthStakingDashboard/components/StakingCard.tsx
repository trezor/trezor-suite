import { BigNumber } from '@trezor/utils/src/bigNumber';
import {
    Badge,
    Button,
    Card,
    Icon,
    Row,
    Grid,
    Column,
    Tooltip,
    InfoItem,
    Paragraph,
    IconName,
    useMediaQuery,
    variables,
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { selectAccountStakeTransactions } from '@suite-common/wallet-core';
import { getAccountEverstakeStakingPool, isPending } from '@suite-common/wallet-utils';

import { FiatValue, Translation, FormattedCryptoAmount } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { ProgressBar } from './styled';
import { ProgressLabels } from './ProgressLabels/ProgressLabels';
import { useProgressLabelsData } from '../hooks/useProgressLabelsData';
import { useIsTxStatusShown } from '../hooks/useIsTxStatusShown';

type ItemProps = {
    label: React.ReactNode;
    iconName: IconName;
    symbol: string;
    cryptoAmount: string;
    fiatAmount: string;
    isReward?: boolean;
    'data-testid': string;
};

const Item = ({
    label,
    symbol,
    cryptoAmount,
    fiatAmount,
    iconName,
    isReward = false,
    'data-testid': dataTestId,
}: ItemProps) => (
    <InfoItem label={label} iconName={iconName}>
        <Paragraph typographyStyle="titleSmall" variant={isReward ? 'primary' : 'default'}>
            <FormattedCryptoAmount data-testid={dataTestId} value={cryptoAmount} symbol={symbol} />
        </Paragraph>
        <Paragraph typographyStyle="hint" variant="tertiary">
            <FiatValue amount={fiatAmount} symbol={symbol} showApproximationIndicator>
                {({ value }) => (value ? <span>{value}</span> : null)}
            </FiatValue>
        </Paragraph>
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
    const isBelowLaptop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.LG})`);

    const {
        isStakingDisabled,
        isUnstakingDisabled,
        stakingMessageContent,
        unstakingMessageContent,
    } = useMessageSystemStaking();

    const {
        autocompoundBalance = '0',
        depositedBalance = '0',
        restakedReward = '0',
        totalPendingStakeBalance = '0',
        withdrawTotalAmount = '0',
        claimableAmount = '0',
    } = getAccountEverstakeStakingPool(selectedAccount) ?? {};

    const canUnstake = new BigNumber(autocompoundBalance).gt(0);
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
        selectAccountStakeTransactions(state, selectedAccount?.key || ''),
    );
    const isStakeConfirming = stakeTxs.some(tx => isPending(tx));

    const { progressLabelsData } = useProgressLabelsData({
        daysToAddToPool,
        isDaysToAddToPoolShown,
        isStakeConfirming,
        isStakePending,
    });

    const dispatch = useDispatch();
    const openStakeModal = () => {
        if (!isStakingDisabled) {
            dispatch(openModal({ type: 'stake' }));
        }
    };
    const openUnstakeModal = () => {
        if (!isUnstakingDisabled) {
            dispatch(openModal({ type: 'unstake' }));
        }
    };

    if (!selectedAccount?.symbol) {
        return null;
    }

    return (
        <Card>
            <Column flex="1" gap={spacings.xxxxl}>
                {(isStakeConfirming || isTxStatusShown) && (
                    <ProgressLabels labels={progressLabelsData} />
                )}

                <Grid columns={isBelowLaptop ? 1 : 2} gap={spacings.xxl}>
                    {isStakePending && (
                        <Item
                            label={<Translation id="TR_STAKE_TOTAL_PENDING" />}
                            iconName="spinnerGap"
                            symbol={selectedAccount?.symbol}
                            cryptoAmount={totalPendingStakeBalance}
                            fiatAmount={totalPendingStakeBalance}
                            data-testid="@account/staking/pending"
                        />
                    )}

                    <Item
                        label={<Translation id="TR_STAKE_STAKE" />}
                        iconName="lock"
                        symbol={selectedAccount?.symbol}
                        cryptoAmount={depositedBalance}
                        fiatAmount={depositedBalance}
                        data-testid="@account/staking/staked"
                    />

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
                                                symbol: selectedAccount?.symbol?.toUpperCase(),
                                            }}
                                        />
                                    }
                                >
                                    <Badge variant="primary" size="small">
                                        <Row gap={spacings.xxs} alignItems="center">
                                            <Translation id="TR_STAKE_RESTAKED_BADGE" />
                                            <Icon name="info" size="small" variant="primary" />
                                        </Row>
                                    </Badge>
                                </Tooltip>
                            </Row>
                        }
                        iconName="plusCircle"
                        isReward
                        cryptoAmount={restakedReward}
                        fiatAmount={restakedReward}
                        data-testid="@account/staking/rewards"
                        symbol={selectedAccount?.symbol}
                    />

                    {isPendingUnstakeShown && (
                        <Item
                            label={
                                <>
                                    <Translation id="TR_STAKE_UNSTAKING" />{' '}
                                    {isDaysToUnstakeShown && (
                                        <>
                                            (~
                                            <Translation
                                                id="TR_STAKE_DAYS"
                                                values={{
                                                    count: daysToUnstake,
                                                }}
                                            />
                                            )
                                        </>
                                    )}
                                </>
                            }
                            iconName="spinnerGap"
                            symbol={selectedAccount?.symbol}
                            cryptoAmount={withdrawTotalAmount}
                            fiatAmount={withdrawTotalAmount}
                            data-testid="@account/staking/unstaking"
                        />
                    )}
                </Grid>

                <ProgressBar
                    $rewards={Number(restakedReward)}
                    $unstaking={Number(withdrawTotalAmount)}
                    $total={
                        Number(depositedBalance) +
                        Number(restakedReward) +
                        Number(withdrawTotalAmount)
                    }
                    $isPendingUnstakeShown={isPendingUnstakeShown}
                />

                <Row margin={{ top: 'auto' }} gap={spacings.xs}>
                    <Tooltip content={stakingMessageContent}>
                        <Button
                            onClick={openStakeModal}
                            isDisabled={isStakingDisabled}
                            icon={isStakingDisabled ? 'info' : undefined}
                            variant="tertiary"
                        >
                            <Translation id="TR_STAKE_STAKE_MORE" />
                        </Button>
                    </Tooltip>
                    <Tooltip content={unstakingMessageContent}>
                        <Button
                            isDisabled={!canUnstake || isUnstakingDisabled}
                            onClick={openUnstakeModal}
                            icon={isUnstakingDisabled ? 'info' : undefined}
                            variant="tertiary"
                        >
                            <Translation id="TR_STAKE_UNSTAKE_TO_CLAIM" />
                        </Button>
                    </Tooltip>
                </Row>
            </Column>
        </Card>
    );
};
