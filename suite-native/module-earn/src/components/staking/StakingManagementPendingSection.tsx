import { useSelector } from 'react-redux';

import {
    type StakeRootState,
    isSupportedNativeStakingManagementSymbol,
    selectAccountNetworkSymbol,
    selectCanClaimByAccountKey,
    selectClaimableAmountByAccountKey,
    selectTotalStakePendingByAccountKey,
    selectUnstakingBalanceByAccountKey,
    selectUnstakingPeriodInDaysByAccountKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

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
    const claimableAmount =
        useSelector((state: StakeRootState) =>
            selectClaimableAmountByAccountKey(state, accountKey),
        ) ?? '0';

    const unstakingBalance =
        useSelector((state: StakeRootState) =>
            selectUnstakingBalanceByAccountKey(state, accountKey),
        ) ?? '0';

    const totalStakePending =
        useSelector((state: StakeRootState) =>
            selectTotalStakePendingByAccountKey(state, accountKey),
        ) ?? '0';

    const unstakingPeriodInDays = useSelector((state: StakeRootState) =>
        selectUnstakingPeriodInDaysByAccountKey(state, accountKey),
    );

    const canClaim = useSelector((state: StakeRootState) =>
        selectCanClaimByAccountKey(state, accountKey),
    );

    const symbol = useSelector((state: StakeRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

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

    const isClaim =
        isPositiveBalance(claimableAmount) &&
        canClaim &&
        !!symbol &&
        isSupportedNativeStakingManagementSymbol(symbol);

    const hasPendingUnstaking =
        isPositiveBalance(unstakingBalance) && !new BigNumber(unstakingBalance).eq(claimableAmount);

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
                            <Translation
                                id="earn.stakingManagementScreen.unstakingItem.label"
                                values={{ days: unstakingPeriodInDays }}
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
