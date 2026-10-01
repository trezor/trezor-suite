import { Translation } from '@suite/intl';
import { type TrxStats } from '@suite-common/earn-staking-api';
import { Table, Text, TextButton } from '@trezor/components';
import { PencilIcon } from '@trezor/icons';

import { TronRepresentativeApr } from './TronRepresentativeApr';
import { TronRepresentativeCell } from './TronRepresentativeCell';
import { type TronVoteFormAllocation } from '../hooks/useTronStakeForm';

interface TronVoteAllocationTableProps {
    allocations: TronVoteFormAllocation[];
    representatives: TrxStats | undefined;
    onEditVotes?: () => void;
}

export const TronVoteAllocationTable = ({
    allocations,
    representatives,
    onEditVotes,
}: TronVoteAllocationTableProps) => (
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
                    <Translation id="TR_EARN_TRON_APR_LABEL" />
                </Table.Cell>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {allocations.map(({ address, votes }) => (
                <Table.Row key={address}>
                    <Table.Cell>
                        <TronRepresentativeCell
                            address={address}
                            representatives={representatives}
                        />
                    </Table.Cell>
                    <Table.Cell align="end">
                        {onEditVotes ? (
                            <TextButton
                                type="button"
                                size="small"
                                intent="neutral"
                                isUnderlined
                                iconRight={PencilIcon}
                                onClick={onEditVotes}
                            >
                                {votes}
                            </TextButton>
                        ) : (
                            <Text typographyStyle="body-md-strong">{votes}</Text>
                        )}
                    </Table.Cell>
                    <Table.Cell align="end">
                        <TronRepresentativeApr
                            address={address}
                            representatives={representatives}
                        />
                    </Table.Cell>
                </Table.Row>
            ))}
        </Table.Body>
    </Table>
);
