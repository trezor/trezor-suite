import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    formatStakingAmount,
    selectStakingAccountNotice,
    selectStakingAccountPositionDetails,
} from '@suite-common/earn-staking';
import { type StakingAmount } from '@suite-common/earn-staking-common';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getTronResources } from '@suite-common/wallet-utils';
import { TronUnassignedVotesBadge } from '@suite-native/accounts';
import {
    Card,
    HStack,
    PressableOpacity,
    ProgressBar,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

import { TronStakingVotesBottomSheet } from './TronStakingVotesBottomSheet';

type TronResourcesCardProps = {
    accountKey: AccountKey;
};

type TronResourceRowProps = {
    labelId: TxKeyPath;
    available: number;
    total: number;
};

const TronResourceRow = ({ labelId, available, total }: TronResourceRowProps) => (
    <VStack spacing="sp8">
        <HStack justifyContent="space-between" alignItems="center">
            <Text variant="body-sm" color="contentSecondary">
                <Translation id={labelId} />
            </Text>
            <Text variant="body-sm">
                <Translation
                    id="earn.tron.resources.availableOfTotal"
                    values={{ available, total }}
                />
            </Text>
        </HStack>
        <ProgressBar value={available} max={Math.max(total, 1)} />
    </VStack>
);

export const TronResourcesCard = ({ accountKey }: TronResourcesCardProps) => {
    const votesModal = useBottomSheetModal();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const stakingDetails = useSelector((state: StakingRootState) =>
        selectStakingAccountPositionDetails(state, accountKey, 'tron-staking'),
    );

    const notice = useSelector((state: StakingRootState) =>
        selectStakingAccountNotice(state, accountKey),
    );

    // Resource meters are account data, not staking state.
    const resources = getTronResources(account ?? undefined);

    if (!resources || !account) return null;

    const bandwidthAvailable =
        resources.availableStakedBandwidth + resources.availableFreeBandwidth;
    const bandwidthTotal = resources.totalStakedBandwidth + resources.totalFreeBandwidth;

    const formatVotes = (amount: StakingAmount) =>
        formatStakingAmount({ amount, networkSymbol: account.symbol });

    const votingPower = stakingDetails === null ? '0' : formatVotes(stakingDetails.votingPower);

    return (
        <VStack spacing="sp16">
            <Text variant="headline-sm">
                <Translation id="earn.tron.resources.title" />
            </Text>
            <Card>
                <VStack spacing="sp16">
                    <TronResourceRow
                        labelId="earn.tron.resources.bandwidth"
                        available={bandwidthAvailable}
                        total={bandwidthTotal}
                    />
                    <TronResourceRow
                        labelId="earn.tron.resources.energy"
                        available={resources.availableEnergy}
                        total={resources.totalEnergy}
                    />
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="earn.tron.votes" />
                        </Text>
                        {notice?.kind === 'votes-left' ? (
                            <PressableOpacity onPress={votesModal.openModal}>
                                <TronUnassignedVotesBadge accountKey={accountKey} />
                            </PressableOpacity>
                        ) : (
                            <Text variant="body-sm">
                                <Translation
                                    id="earn.tron.allVotesAssigned"
                                    values={{ count: votingPower }}
                                />
                            </Text>
                        )}
                    </HStack>
                </VStack>
            </Card>
            <TronStakingVotesBottomSheet
                ref={votesModal.bottomSheetRef}
                onClose={votesModal.closeModal}
            />
        </VStack>
    );
};
