import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useTronStakingStats } from '@suite-common/earn-staking-api';
import { useDispatch } from '@suite-common/redux-utils';
import {
    getTronAvailableVotingPower,
    getTronTotalVotingPower,
    getTronVotes,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    Banner,
    Button,
    Card,
    Column,
    Modal,
    Paragraph,
    Row,
    Table,
    Text,
    Tooltip,
} from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { TronStakeInfoRow } from 'src/components/earn/staking/tron/TronStakeInfoRow';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { TronVoteAllocationRow } from './TronVoteAllocationRow';

interface TronVoteAllocationModalProps {
    account: Account;
    onClose: () => void;
}

export const TronVoteAllocationModal = ({ account, onClose }: TronVoteAllocationModalProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { stats } = useTronStakingStats();

    const { isVotingDisabled, votingMessageContent } = useMessageSystemStaking(account.symbol);

    const remainingVotes = getTronAvailableVotingPower(account);
    const totalVotes = getTronTotalVotingPower(account);
    const hasRemainingVotes = new BigNumber(remainingVotes).gt(0);
    const votes = getTronVotes(account);
    const hasVotes = votes.length > 0;

    const goToVote = () => {
        if (isVotingDisabled) {
            return;
        }

        dispatch(
            gotoThunk({
                routeName: 'earn-tron-vote',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
        onClose();

        analytics.report({
            type: events.stakingUpdateProviderEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <Modal
            width={600}
            heading={<Translation id="TR_EARN_TRON_VOTE_ALLOCATION" />}
            onCancel={onClose}
        >
            <Column gap={16} alignItems="stretch">
                <Card type="contrast" paddingType="none">
                    <TronStakeInfoRow
                        label={<Translation id="TR_EARN_TRON_REMAINING_VOTES_LABEL" />}
                    >
                        <Text typographyStyle="body-md-strong">
                            {remainingVotes}/{totalVotes}
                        </Text>
                    </TronStakeInfoRow>
                </Card>

                {hasRemainingVotes && (
                    <Banner
                        intent="info"
                        icon
                        description={<Translation id="TR_EARN_TRON_ASSIGN_VOTES_BANNER" />}
                        rightContent={
                            <Tooltip content={votingMessageContent}>
                                <Banner.Button onClick={goToVote} isDisabled={isVotingDisabled}>
                                    <Translation id="TR_EARN_TRON_VOTE" />
                                </Banner.Button>
                            </Tooltip>
                        }
                    />
                )}

                <Card paddingType="none">
                    <Table>
                        <Table.Header>
                            <Table.Row>
                                <Table.Cell>
                                    <Translation id="TR_EARN_TRON_REPRESENTATIVE" />
                                </Table.Cell>
                                <Table.Cell>
                                    <Translation id="TR_TRON_VOTES" />
                                </Table.Cell>
                                <Table.Cell>
                                    <Translation id="TR_EARN_TRON_APR_LABEL" />
                                </Table.Cell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {hasVotes ? (
                                votes.map(vote => (
                                    <TronVoteAllocationRow
                                        key={vote.address}
                                        vote={vote}
                                        representatives={stats.data}
                                    />
                                ))
                            ) : (
                                <Table.Row>
                                    <Table.Cell colSpan={3} align="center">
                                        <Paragraph
                                            typographyStyle="body-sm"
                                            intent="neutral"
                                            priority="secondary"
                                        >
                                            <Translation id="TR_EARN_TRON_NO_VOTES" />
                                        </Paragraph>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                </Card>

                {hasVotes && (
                    <Row>
                        <Tooltip content={votingMessageContent}>
                            <Button
                                intent="neutral"
                                priority="secondary"
                                onClick={goToVote}
                                isDisabled={isVotingDisabled}
                            >
                                <Translation id="TR_EARN_TRON_CHANGE_VOTES" />
                            </Button>
                        </Tooltip>
                    </Row>
                )}
            </Column>
        </Modal>
    );
};
