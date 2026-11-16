import { useSelector } from 'react-redux';

import {
    type StakingAccountProductRootState,
    type StakingRootState,
    formatStakingAmount,
    isStakingOperationAvailable,
    selectStakingAccountProductDescriptor,
    selectStakingAccountTotals,
    selectStakingPosition,
    useStakingAccess,
    useStakingPeriods,
} from '@suite-common/earn-staking';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance, parseAccountKey } from '@suite-common/wallet-utils';
import { Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

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

    const productId = useSelector(
        (state: StakingAccountProductRootState) =>
            selectStakingAccountProductDescriptor(state, accountKey)?.id ?? null,
    );
    const position = useSelector((state: StakingRootState) =>
        productId === null ? null : selectStakingPosition(state, accountKey, productId),
    );
    const totals = useSelector((state: StakingRootState) =>
        selectStakingAccountTotals(state, accountKey),
    );
    const access = useStakingAccess(productId);
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

    const isWithdrawAvailable = isStakingOperationAvailable({
        position,
        access,
        operation: 'withdraw',
    });
    // A withheld withdraw keeps its card, with the reason, as the kill switch did.
    const isWithdrawWithheld =
        position !== null &&
        position.operations.includes('withdraw') &&
        access.disabled.withdraw !== undefined;
    const isClaim = isWithdrawAvailable || isWithdrawWithheld;

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
                            exitPeriodDays === null ? (
                                <Translation id="earn.stakingManagementScreen.unstakingItem.labelWithoutDays" />
                            ) : (
                                <Translation
                                    id="earn.stakingManagementScreen.unstakingItem.label"
                                    values={{ days: exitPeriodDays }}
                                />
                            )
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
