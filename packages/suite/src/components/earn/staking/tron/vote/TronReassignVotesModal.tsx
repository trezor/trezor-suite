import { useState } from 'react';

import { Translation } from '@suite/intl';
import { type TrxStats } from '@suite-common/earn-staking-api';
import { Banner, Card, Column, Input, Modal, Table, Text } from '@trezor/components';

import { TronRepresentativeApr } from './TronRepresentativeApr';
import { TronRepresentativeCell } from './TronRepresentativeCell';
import { TronVoteAprLabel } from './TronVoteAprLabel';
import { TronStakeInfoRow } from '../TronStakeInfoRow';
import { type TronVoteFormAllocation } from '../hooks/useTronStakeForm';
import { getRemainingVotes, parseVoteCount } from '../utils/voteUtils';

interface TronReassignVotesModalProps {
    allocations: TronVoteFormAllocation[];
    totalVotes: number;
    representatives: TrxStats | undefined;
    onConfirm: (allocations: TronVoteFormAllocation[]) => void;
    onClose: () => void;
}

export const TronReassignVotesModal = ({
    allocations,
    totalVotes,
    representatives,
    onConfirm,
    onClose,
}: TronReassignVotesModalProps) => {
    const [draftAllocations, setDraftAllocations] = useState(allocations);

    const remainingVotes = getRemainingVotes({ totalVotes, allocations: draftAllocations });
    const isOverAllocated = remainingVotes < 0;
    const hasInvalidCount = draftAllocations.some(({ votes }) => parseVoteCount(votes) === null);
    const canConfirm = !isOverAllocated && !hasInvalidCount;

    const handleConfirm = () => {
        onConfirm(
            draftAllocations.map(allocation => ({
                ...allocation,
                votes: String(parseVoteCount(allocation.votes) ?? 0),
            })),
        );
    };

    const updateVotes = (address: string, votes: string) => {
        setDraftAllocations(current =>
            current.map(allocation =>
                allocation.address === address ? { ...allocation, votes } : allocation,
            ),
        );
    };

    return (
        <Modal
            width={600}
            heading={<Translation id="TR_EARN_TRON_REASSIGN_VOTES" />}
            description={<Translation id="TR_EARN_TRON_REASSIGN_VOTES_DESCRIPTION" />}
            onCancel={onClose}
            bottomContent={
                <>
                    <Modal.Button onClick={handleConfirm} isDisabled={!canConfirm}>
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onClose}>
                        <Translation id="TR_CLOSE" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={12} alignItems="stretch">
                <Card type="contrast" paddingType="none">
                    <TronStakeInfoRow
                        label={<Translation id="TR_EARN_TRON_REMAINING_VOTES_LABEL" />}
                    >
                        <Text typographyStyle="body-md-strong">
                            {Math.max(remainingVotes, 0)} / {totalVotes}
                        </Text>
                    </TronStakeInfoRow>
                </Card>

                {isOverAllocated && (
                    <Banner
                        intent="warning"
                        description={
                            <Translation
                                id="TR_EARN_TRON_VOTES_EXCEED_TOTAL"
                                values={{ total: totalVotes }}
                            />
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
                                <Table.Cell align="end">
                                    <Translation id="TR_TRON_VOTES" />
                                </Table.Cell>
                                <Table.Cell align="end">
                                    <TronVoteAprLabel />
                                </Table.Cell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {draftAllocations.map(({ address, votes }) => {
                                const isCountInvalid = parseVoteCount(votes) === null;

                                return (
                                    <Table.Row key={address}>
                                        <Table.Cell>
                                            <TronRepresentativeCell
                                                address={address}
                                                representatives={representatives}
                                                isAddressShown
                                            />
                                        </Table.Cell>
                                        <Table.Cell align="end">
                                            <Input
                                                value={votes}
                                                onChange={event =>
                                                    updateVotes(address, event.target.value)
                                                }
                                                inputMode="numeric"
                                                size="small"
                                                hasError={isCountInvalid}
                                                bottomText={
                                                    isCountInvalid ? (
                                                        <Translation id="TR_EARN_TRON_INVALID_VOTE_COUNT" />
                                                    ) : undefined
                                                }
                                            />
                                        </Table.Cell>
                                        <Table.Cell align="end">
                                            <TronRepresentativeApr
                                                address={address}
                                                representatives={representatives}
                                            />
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table>
                </Card>
            </Column>
        </Modal>
    );
};
