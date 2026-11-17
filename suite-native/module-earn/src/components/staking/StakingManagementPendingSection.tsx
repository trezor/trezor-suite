import {
    formatStakingAmount,
    getStakingOperationAvailability,
    useStakingAccountPosition,
    useStakingPeriods,
} from '@suite-common/earn-staking';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance, parseAccountKey } from '@suite-common/wallet-utils';
import { Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { StakingDaysLabel } from './StakingDaysLabel';
import { StakingManagementPendingItem } from './StakingManagementPendingItem';
import { StakingManagementPendingStakeModal } from './StakingManagementPendingStakeModal';
import { StakingManagementReadyToClaimCard } from './StakingManagementReadyToClaimCard';
import { StakingManagementUnstakingModal } from './StakingManagementUnstakingModal';

type StakingManagementPendingSectionProps = {
    accountKey: AccountKey;
};

export const StakingManagementPendingSection = ({
    accountKey,
}: StakingManagementPendingSectionProps) => {
    const { networkSymbol } = parseAccountKey(accountKey);

    const { productId, position, totals, access } = useStakingAccountPosition(accountKey);
    const { exitPeriodDays } = useStakingPeriods(productId);

    const {
        bottomSheetRef: unstakingModalRef,
        openModal: openUnstakingModal,
        closeModal: closeUnstakingModal,
    } = useBottomSheetModal();

    const {
        bottomSheetRef: pendingStakeModalRef,
        openModal: openPendingStakeModal,
        closeModal: closePendingStakeModal,
    } = useBottomSheetModal();

    // A withheld withdraw keeps its card, with the reason, as the kill switch did.
    const isClaim =
        getStakingOperationAvailability({ position, access, operation: 'withdraw' }) !==
        'unavailable';

    const unstakingBalance = formatStakingAmount({ amount: totals.unstaking, networkSymbol });
    const totalStakePending = formatStakingAmount({ amount: totals.pending, networkSymbol });

    const hasPendingUnstaking = isPositiveBalance(unstakingBalance);
    const hasPendingDeposit = isPositiveBalance(totalStakePending);

    const hasPendingActions = isClaim || hasPendingUnstaking || hasPendingDeposit;

    if (!hasPendingActions) return null;

    return (
        <>
            <VStack spacing="sp12">
                <Text variant="headline-sm">
                    <Translation id="earn.stakingManagementScreen.pendingActions" />
                </Text>
                {isClaim && <StakingManagementReadyToClaimCard accountKey={accountKey} />}
                {hasPendingUnstaking && (
                    <StakingManagementPendingItem
                        accountKey={accountKey}
                        label={
                            <StakingDaysLabel
                                days={exitPeriodDays}
                                withDaysId="earn.stakingManagementScreen.unstakingItem.label"
                                withoutDaysId="earn.stakingManagementScreen.unstakingItem.labelWithoutDays"
                            />
                        }
                        amount={unstakingBalance}
                        onPress={openUnstakingModal}
                    />
                )}
                {hasPendingDeposit && (
                    <StakingManagementPendingItem
                        accountKey={accountKey}
                        label={
                            <Translation id="earn.stakingManagementScreen.pendingStakesItem.label" />
                        }
                        amount={totalStakePending}
                        onPress={openPendingStakeModal}
                    />
                )}
            </VStack>
            <StakingManagementUnstakingModal
                ref={unstakingModalRef}
                accountKey={accountKey}
                onClose={closeUnstakingModal}
            />
            <StakingManagementPendingStakeModal
                ref={pendingStakeModalRef}
                accountKey={accountKey}
                onClose={closePendingStakeModal}
            />
        </>
    );
};
