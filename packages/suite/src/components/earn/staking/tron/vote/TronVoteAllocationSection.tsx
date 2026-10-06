import { useState } from 'react';
import { useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { getTotalVotes } from '@suite-common/wallet-core';
import { Banner, Button, Card, Column, Row } from '@trezor/components';

import { TronReassignVotesModal } from './TronReassignVotesModal';
import { TronSelectRepresentativesModal } from './TronSelectRepresentativesModal';
import { TronVoteAllocationTable } from './TronVoteAllocationTable';
import { useTronStakeContext } from '../TronStakeContext';
import { type TronVoteFormAllocation } from '../hooks/useTronStakeForm';
import {
    applyRepresentativeSelection,
    applyVoteReassignment,
    getRemainingVotes,
} from '../utils/voteUtils';

export const TronVoteAllocationSection = () => {
    const { account, form, representatives, actions } = useTronStakeContext();
    const { control, setValue } = form.methods;

    const [selectModalShownAddresses, setSelectModalShownAddresses] = useState<string[] | null>(
        null,
    );
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);

    const allocations = useWatch({ control, name: 'voteAllocations' });

    const isDisabled = !!actions.pendingTxid || actions.isSubmitting;
    const isSelectionDisabled = isDisabled || representatives.isLoading;
    const totalVotes = getTotalVotes(account);
    const remainingVotes = getRemainingVotes({ totalVotes, allocations });
    const hasAllocations = allocations.length > 0;

    const updateAllocations = (nextAllocations: TronVoteFormAllocation[]) => {
        form.markVoteAllocationsEdited();
        setValue('voteAllocations', nextAllocations, { shouldDirty: true, shouldValidate: true });
    };

    const openSelectModal = () => {
        setSelectModalShownAddresses(allocations.map(({ address }) => address));
    };

    const closeSelectModal = () => {
        setSelectModalShownAddresses(null);
    };

    const handleSelectConfirm = (selectedAddresses: string[]) => {
        updateAllocations(
            applyRepresentativeSelection({
                allocations,
                shownAddresses: selectModalShownAddresses ?? [],
                selectedAddresses,
                totalVotes,
            }),
        );
        closeSelectModal();
    };

    const handleReassignConfirm = (reassignedAllocations: TronVoteFormAllocation[]) => {
        updateAllocations(applyVoteReassignment({ allocations, reassignedAllocations }));
        setIsReassignModalOpen(false);
    };

    return (
        <Column gap={16} alignItems="stretch">
            {hasAllocations ? (
                <>
                    <Card paddingType="none">
                        <TronVoteAllocationTable
                            allocations={allocations}
                            representatives={representatives.data}
                            onEditVotes={
                                isDisabled ? undefined : () => setIsReassignModalOpen(true)
                            }
                        />
                    </Card>

                    <Row justifyContent="center">
                        <Button
                            intent="neutral"
                            priority="secondary"
                            size="medium"
                            onClick={openSelectModal}
                            isDisabled={isSelectionDisabled}
                        >
                            <Translation id="TR_EARN_TRON_CHANGE_REPRESENTATIVES" />
                        </Button>
                    </Row>

                    {remainingVotes > 0 && (
                        <Banner
                            intent="info"
                            icon
                            description={
                                <Translation
                                    id="TR_EARN_TRON_VOTES_TO_ALLOCATE"
                                    values={{ count: remainingVotes }}
                                />
                            }
                        />
                    )}

                    {remainingVotes < 0 && (
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
                </>
            ) : (
                <Button
                    size="large"
                    width="100%"
                    onClick={openSelectModal}
                    isDisabled={isSelectionDisabled}
                >
                    <Translation id="TR_EARN_TRON_SELECT_REPRESENTATIVES" />
                </Button>
            )}

            {selectModalShownAddresses !== null && (
                <TronSelectRepresentativesModal
                    symbol={account.symbol}
                    selectedAddresses={selectModalShownAddresses}
                    representatives={representatives.data}
                    onConfirm={handleSelectConfirm}
                    onClose={closeSelectModal}
                />
            )}

            {isReassignModalOpen && (
                <TronReassignVotesModal
                    allocations={allocations}
                    totalVotes={totalVotes}
                    representatives={representatives.data}
                    onConfirm={handleReassignConfirm}
                    onClose={() => setIsReassignModalOpen(false)}
                />
            )}
        </Column>
    );
};
