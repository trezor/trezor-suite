import { useState } from 'react';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
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
import { BigNumber } from '@trezor/utils';

import { formatApr } from 'src/components/earn/staking/tron/voteUtils';
import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

import { TronVoteAllocationModal } from './TronVoteAllocationModal/TronVoteAllocationModal';

interface TronStakedCardProps {
    account: Account;
}

export const TronStakedCard = ({ account }: TronStakedCardProps) => {
    const dispatch = useDispatch();
    const [isVoteAllocationOpen, setIsVoteAllocationOpen] = useState(false);
    const { stats, maxApr } = useTronStakingStats();

    const stakedBalance = getTronAccountTotalStakingBalance(account) ?? '0';
    const hasStake = new BigNumber(stakedBalance).gt(0);
    const votedAddresses = getTronVotes(account).map(vote => vote.address);
    const apr = votedAddresses.length > 0 ? getTronVotedApr(stats.data, votedAddresses) : maxApr;
    const remainingVotes = getTronAvailableVotingPower(account);
    const totalVotes = getTronTotalVotingPower(account);
    const hasRemainingVotes = new BigNumber(remainingVotes).gt(0);
    const shouldShowRemainingVotes = new BigNumber(remainingVotes).plus(totalVotes).gt(0);

    const goToFlow = (routeName: 'earn-tron-stake' | 'earn-tron-unstake' | 'earn-tron-vote') =>
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
                    <Button
                        intent="brand"
                        priority="primary"
                        onClick={() => goToFlow('earn-tron-stake')}
                    >
                        <Translation
                            id={
                                hasStake
                                    ? 'TR_EARN_STAKING_DASHBOARD_STAKE_MORE'
                                    : 'TR_EARN_STAKING_DASHBOARD_STAKE_NOW'
                            }
                        />
                    </Button>
                    {hasStake && (
                        <Button
                            intent="neutral"
                            priority="secondary"
                            onClick={() => goToFlow('earn-tron-unstake')}
                        >
                            <Translation id="TR_EARN_TRON_UNSTAKE_TITLE" />
                        </Button>
                    )}
                    {hasStake && (
                        <Button
                            intent="neutral"
                            priority="secondary"
                            onClick={() => goToFlow('earn-tron-vote')}
                        >
                            <Translation id="TR_EARN_TRON_VOTE" />
                        </Button>
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
                            <IconCircle name="warning" size={24} intent="warning" />
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
