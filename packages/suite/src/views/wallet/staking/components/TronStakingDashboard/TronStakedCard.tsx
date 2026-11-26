import { useState } from 'react';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation, type TranslationKey } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    formatStakingAmount,
    getStakingOperationAvailability,
    selectStakingAccountNotice,
    selectStakingAccountPositionDetails,
    useNetworkStakingRate,
    useStakingAccountPosition,
} from '@suite-common/earn-staking';
import { type StakingAmount, type StakingOperation } from '@suite-common/earn-staking-common';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import {
    Button,
    Card,
    Column,
    IconCircle,
    Row,
    Text,
    TextButton,
    Tooltip,
} from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { InfoIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useFormatApy } from '#src/hooks/earn/useFormatApy';
import { useTronFirmwareUpgradeModal } from '#src/hooks/earn/useTronFirmwareUpgradeModal';
import { useSelector } from '#src/hooks/suite/useSelector';

import { TronVoteAllocationModal } from './TronVoteAllocationModal/TronVoteAllocationModal';
import {
    type TronStakingOperation,
    useTronStakingOperation,
} from './hooks/useTronStakingOperation';

type TronFlowRoute = 'earn-tron-stake' | 'earn-tron-unstake' | 'earn-tron-vote';

type TronFlow = {
    operation: StakingOperation;
    featureName: TranslationKey;
    event:
        | typeof events.stakingStakeEvent.name
        | typeof events.stakingUnstakeEvent.name
        | typeof events.stakingUpdateProviderEvent.name;
};

const TRON_FLOWS: Record<TronFlowRoute, TronFlow> = {
    'earn-tron-stake': {
        operation: 'stake',
        featureName: 'TR_EARN_TRON_STAKE_TITLE',
        event: events.stakingStakeEvent.name,
    },
    'earn-tron-unstake': {
        operation: 'unstake',
        featureName: 'TR_EARN_TRON_UNSTAKE_TITLE',
        event: events.stakingUnstakeEvent.name,
    },
    'earn-tron-vote': {
        operation: 'vote',
        featureName: 'TR_EARN_TRON_VOTE',
        event: events.stakingUpdateProviderEvent.name,
    },
};

interface TronStakedCardProps {
    account: Account;
}

export const TronStakedCard = ({ account }: TronStakedCardProps) => {
    const formatApyValue = useFormatApy();
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const [isVoteAllocationOpen, setIsVoteAllocationOpen] = useState(false);

    const { productId, position, totals, access } = useStakingAccountPosition(account.key);

    const { rate } = useNetworkStakingRate({
        networkSymbol: account.symbol,
        accountKey: account.key,
    });

    const stakingDetails = useSelector(state =>
        selectStakingAccountPositionDetails(state, account.key, 'tron-staking'),
    );

    const notice = useSelector(state => selectStakingAccountNotice(state, account.key));

    const stake = useTronStakingOperation(productId, 'stake');
    const unstake = useTronStakingOperation(productId, 'unstake');
    const vote = useTronStakingOperation(productId, 'vote');
    const { openFirmwareModal, firmwareModal } = useTronFirmwareUpgradeModal();

    const operations: Record<StakingOperation, TronStakingOperation | null> = {
        stake,
        unstake,
        vote,
        withdraw: null,
        claim: null,
        redelegate: null,
    };

    const formatAmount = (amount: StakingAmount) =>
        formatStakingAmount({ amount, networkSymbol: account.symbol });

    const stakedBalance = formatAmount(totals.staked);
    const hasStake = isPositiveBalance(stakedBalance);

    // The position offers unstake while TRX is frozen and vote while anything is staked.
    const isOffered = (operation: StakingOperation) =>
        getStakingOperationAvailability({ position, access, operation }) !== 'unavailable';

    const hasRemainingVotes = notice?.kind === 'votes-left';
    const remainingVotes = hasRemainingVotes ? notice.count : '0';
    const totalVotes = stakingDetails === null ? '0' : formatAmount(stakingDetails.votingPower);
    const isVotingPrimary = hasRemainingVotes && isOffered('vote');
    const shouldShowRemainingVotes = hasRemainingVotes || isPositiveBalance(totalVotes);

    const goToFlow = (routeName: TronFlowRoute) => {
        const flow = TRON_FLOWS[routeName];
        const operation = operations[flow.operation];

        if (operation?.isDisabled) return;

        if (operation?.isFirmwareOutdated) {
            openFirmwareModal(flow.featureName);

            return;
        }

        dispatch(
            gotoThunk({
                routeName,
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        analytics.report({
            type: flow.event,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <>
            {firmwareModal}

            <Card
                paddingType="normal"
                data-testid="@staking/tron-staked-card/container"
                header={
                    <Column gap={2} alignItems="flex-start">
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_EARN_TRON_STAKED" />
                        </Text>

                        <Text
                            typographyStyle="headline-sm"
                            data-testid="@staking/tron-staked-card/staked-amount"
                        >
                            <FormattedCryptoAmount
                                value={stakedBalance}
                                networkSymbol={account.symbol}
                            />
                        </Text>

                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <BaseCurrencyValue
                                amount={stakedBalance}
                                symbol={account.symbol}
                                showApproximationIndicator
                            />
                        </Text>
                    </Column>
                }
                footer={
                    <Row gap={8}>
                        <Tooltip content={stake.message}>
                            <Button
                                intent={isVotingPrimary ? 'neutral' : 'brand'}
                                priority={isVotingPrimary ? 'secondary' : 'primary'}
                                onClick={() => goToFlow('earn-tron-stake')}
                                isDisabled={stake.isDisabled}
                                data-testid="@staking/tron-staked-card/stake-button"
                            >
                                <Translation
                                    id={
                                        hasStake
                                            ? 'TR_EARN_STAKING_DASHBOARD_STAKE_MORE'
                                            : 'TR_EARN_STAKING_DASHBOARD_STAKE_NOW'
                                    }
                                />
                            </Button>
                        </Tooltip>

                        {isOffered('unstake') && (
                            <Tooltip content={unstake.message}>
                                <Button
                                    intent="neutral"
                                    priority="secondary"
                                    onClick={() => goToFlow('earn-tron-unstake')}
                                    isDisabled={unstake.isDisabled}
                                    data-testid="@staking/tron-staked-card/unstake-button"
                                >
                                    <Translation id="TR_EARN_TRON_UNSTAKE_TITLE" />
                                </Button>
                            </Tooltip>
                        )}

                        {isOffered('vote') && (
                            <Tooltip content={vote.message}>
                                <Button
                                    intent={isVotingPrimary ? 'brand' : 'neutral'}
                                    priority={isVotingPrimary ? 'primary' : 'secondary'}
                                    onClick={() => goToFlow('earn-tron-vote')}
                                    isDisabled={vote.isDisabled}
                                    data-testid="@staking/tron-staked-card/vote-button"
                                >
                                    <Translation id="TR_EARN_TRON_VOTE" />
                                </Button>
                            </Tooltip>
                        )}
                    </Row>
                }
            >
                <Row justifyContent="space-between" alignItems="center">
                    <Text
                        typographyStyle="body-md-strong"
                        data-testid="@staking/tron-staked-card/apr"
                    >
                        <Translation id="TR_EARN_TRON_APR_LABEL" />{' '}
                        <span data-testid="@staking/tron-staked-card/apr-value">
                            {formatApyValue(rate, { withSymbol: true })}
                        </span>
                    </Text>

                    {hasRemainingVotes ? (
                        <Tooltip content={<Translation id="TR_EARN_TRON_ASSIGN_VOTES_TOOLTIP" />}>
                            <Row gap={4} alignItems="center">
                                <IconCircle icon={InfoIcon} size={24} intent="info" />

                                <TextButton
                                    size="small"
                                    intent="neutral"
                                    priority="secondary"
                                    isUnderlined
                                    onClick={() => setIsVoteAllocationOpen(true)}
                                    data-testid="@staking/tron-staked-card/votes-to-allocate-button"
                                >
                                    <Translation
                                        id="TR_EARN_TRON_VOTES_TO_ALLOCATE"
                                        values={{ count: remainingVotes }}
                                    />
                                </TextButton>
                            </Row>
                        </Tooltip>
                    ) : (
                        <>
                            {shouldShowRemainingVotes && (
                                <TextButton
                                    size="small"
                                    intent="neutral"
                                    priority="secondary"
                                    isUnderlined
                                    onClick={() => setIsVoteAllocationOpen(true)}
                                    data-testid="@staking/tron-staked-card/remaining-votes-button"
                                >
                                    <Translation
                                        id="TR_EARN_TRON_REMAINING_VOTES"
                                        values={{ remaining: remainingVotes, total: totalVotes }}
                                    />
                                </TextButton>
                            )}
                        </>
                    )}
                </Row>

                {isVoteAllocationOpen && (
                    <TronVoteAllocationModal
                        account={account}
                        onClose={() => setIsVoteAllocationOpen(false)}
                    />
                )}
            </Card>
        </>
    );
};
