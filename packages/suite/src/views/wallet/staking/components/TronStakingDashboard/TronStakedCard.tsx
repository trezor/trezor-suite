import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { getTronVotedApr, useTronStakingStats } from '@suite-common/earn-staking-api';
import { type Account } from '@suite-common/wallet-types';
import {
    getTronAccountTotalStakingBalance,
    getTronAvailableVotingPower,
    getTronTotalVotingPower,
    getTronVotes,
} from '@suite-common/wallet-utils';
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
import { WarningIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { formatApr } from 'src/components/earn/staking/tron/voteUtils';
import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { TronVoteAllocationModal } from './TronVoteAllocationModal/TronVoteAllocationModal';

interface TronStakedCardProps {
    account: Account;
}

export const TronStakedCard = ({ account }: TronStakedCardProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const [isVoteAllocationOpen, setIsVoteAllocationOpen] = useState(false);
    const { stats, maxApr } = useTronStakingStats();

    const {
        isStakingDisabled,
        stakingMessageContent,
        isUnstakingDisabled,
        unstakingMessageContent,
        isVotingDisabled,
        votingMessageContent,
    } = useMessageSystemStaking(account.symbol);

    const stakedBalance = getTronAccountTotalStakingBalance(account) ?? '0';
    const hasStake = new BigNumber(stakedBalance).gt(0);
    const votedAddresses = getTronVotes(account).map(vote => vote.address);
    const apr = votedAddresses.length > 0 ? getTronVotedApr(stats.data, votedAddresses) : maxApr;
    const remainingVotes = getTronAvailableVotingPower(account);
    const totalVotes = getTronTotalVotingPower(account);
    const hasRemainingVotes = new BigNumber(remainingVotes).gt(0);
    const shouldShowRemainingVotes = new BigNumber(remainingVotes).plus(totalVotes).gt(0);

    const goToFlow = (routeName: 'earn-tron-stake' | 'earn-tron-unstake' | 'earn-tron-vote') => {
        if (isStakingDisabled && routeName === 'earn-tron-stake') {
            return;
        }

        if (isUnstakingDisabled && routeName === 'earn-tron-unstake') {
            return;
        }

        if (isVotingDisabled && routeName === 'earn-tron-vote') {
            return;
        }

        dispatch(
            goto({
                routeName,
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        const eventTypeByRoute = {
            'earn-tron-stake': events.stakingStakeEvent.name,
            'earn-tron-unstake': events.stakingUnstakeEvent.name,
            'earn-tron-vote': events.stakingUpdateProviderEvent.name,
        } as const;

        analytics.report({
            type: eventTypeByRoute[routeName],
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <Card
            paddingType="normal"
            header={
                <Column gap={2} alignItems="flex-start">
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_EARN_TRON_STAKED" />
                    </Text>
                    <Text typographyStyle="headline-sm">
                        <FormattedCryptoAmount value={stakedBalance} symbol={account.symbol} />
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
                    <Tooltip content={stakingMessageContent}>
                        <Button
                            intent="brand"
                            priority="primary"
                            onClick={() => goToFlow('earn-tron-stake')}
                            isDisabled={isStakingDisabled}
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

                    {hasStake && (
                        <Tooltip content={unstakingMessageContent}>
                            <Button
                                intent="neutral"
                                priority="secondary"
                                onClick={() => goToFlow('earn-tron-unstake')}
                                isDisabled={isUnstakingDisabled}
                            >
                                <Translation id="TR_EARN_TRON_UNSTAKE_TITLE" />
                            </Button>
                        </Tooltip>
                    )}

                    {hasStake && (
                        <Tooltip content={votingMessageContent}>
                            <Button
                                intent="neutral"
                                priority="secondary"
                                onClick={() => goToFlow('earn-tron-vote')}
                                isDisabled={isVotingDisabled}
                            >
                                <Translation id="TR_EARN_TRON_VOTE" />
                            </Button>
                        </Tooltip>
                    )}
                </Row>
            }
        >
            <Row justifyContent="space-between" alignItems="center">
                <Text typographyStyle="body-md-strong">
                    <Translation id="TR_EARN_TRON_APR_LABEL" /> {formatApr(apr ?? undefined)}
                </Text>
                {hasRemainingVotes ? (
                    <Tooltip content={<Translation id="TR_EARN_TRON_ASSIGN_VOTES_TOOLTIP" />}>
                        <Row gap={4} alignItems="center">
                            <IconCircle icon={WarningIcon} size={24} intent="warning" />
                            <TextButton
                                size="small"
                                intent="neutral"
                                priority="secondary"
                                isUnderlined
                                onClick={() => setIsVoteAllocationOpen(true)}
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
    );
};
