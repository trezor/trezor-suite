import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useTronStakingStats } from '@suite-common/earn-staking-api';
import { type Account } from '@suite-common/wallet-types';
import {
    getTronAvailableVotingPower,
    getTronTotalVotingPower,
    getTronVotes,
} from '@suite-common/wallet-utils';
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
} from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { TronStakeInfoRow } from 'src/components/earn/staking/tron/TronStakeInfoRow';
import { useDispatch } from 'src/hooks/suite';

import { TronVoteAllocationRow } from './TronVoteAllocationRow';

interface TronVoteAllocationModalProps {
    account: Account;
    onClose: () => void;
}

export const TronVoteAllocationModal = ({ account, onClose }: TronVoteAllocationModalProps) => {
    const dispatch = useDispatch();
    const { stats } = useTronStakingStats();

    const remainingVotes = getTronAvailableVotingPower(account);
    const totalVotes = getTronTotalVotingPower(account);
    const hasRemainingVotes = new BigNumber(remainingVotes).gt(0);
    const votes = getTronVotes(account);
    const hasVotes = votes.length > 0;

    const goToVote = () => {
        dispatch(
            goto({
                routeName: 'earn-tron-vote',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
        onClose();
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
                            <Banner.Button onClick={goToVote}>
                                <Translation id="TR_EARN_TRON_VOTE" />
                            </Banner.Button>
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
                        <Button intent="neutral" priority="secondary" onClick={goToVote}>
                            <Translation id="TR_EARN_TRON_CHANGE_VOTES" />
                        </Button>
                    </Row>
                )}
            </Column>
        </Modal>
    );
};
