import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    selectAccountByKey,
    selectTronAvailableVotingPowerByAccountKey,
    selectTronTotalVotingPowerByAccountKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getTronResources } from '@suite-common/wallet-utils';
import {
    Card,
    HStack,
    PressableOpacity,
    ProgressBar,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TronStakingVotesBottomSheet } from './TronStakingVotesBottomSheet';

type TronResourcesCardProps = {
    accountKey: AccountKey;
};

type TronResourceRowProps = {
    labelId: TxKeyPath;
    available: number;
    total: number;
};

const remainingVotesStyle = prepareNativeStyle(utils => ({
    textDecorationLine: 'underline',
    marginLeft: utils.spacings.sp4,
}));

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
    const { applyStyle } = useNativeStyles();
    const votesModal = useBottomSheetModal();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const totalVotingPower = useSelector((state: AccountsRootState) =>
        selectTronTotalVotingPowerByAccountKey(state, accountKey),
    );
    const availableVotingPower = useSelector((state: AccountsRootState) =>
        selectTronAvailableVotingPowerByAccountKey(state, accountKey),
    );

    const resources = getTronResources(account ?? undefined);

    if (!resources) return null;

    const bandwidthAvailable =
        resources.availableStakedBandwidth + resources.availableFreeBandwidth;
    const bandwidthTotal = resources.totalStakedBandwidth + resources.totalFreeBandwidth;
    const hasRemainingVotes = availableVotingPower !== '0';

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
                        {hasRemainingVotes ? (
                            <PressableOpacity onPress={votesModal.openModal}>
                                <HStack alignItems="center">
                                    <Icon name="warning" color="contentWarning" size="medium" />
                                    <Text
                                        variant="body-sm-strong"
                                        color="contentWarning"
                                        style={applyStyle(remainingVotesStyle)}
                                    >
                                        <Translation
                                            id="earn.tron.votesRemaining"
                                            values={{ count: availableVotingPower }}
                                        />
                                    </Text>
                                </HStack>
                            </PressableOpacity>
                        ) : (
                            <Text variant="body-sm">
                                <Translation
                                    id="earn.tron.allVotesAssigned"
                                    values={{ count: totalVotingPower }}
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
