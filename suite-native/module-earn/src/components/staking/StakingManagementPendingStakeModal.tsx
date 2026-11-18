import { useSelector } from 'react-redux';

import { useStakingActivationDays } from '@suite-common/earn';
import {
    type StakingRootState,
    formatStakingAmount,
    selectIsStakingOperationPending,
    useStakingAccountPosition,
    useStakingPeriods,
} from '@suite-common/earn-staking';
import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { getNetworkType } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance, parseAccountKey } from '@suite-common/wallet-utils';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Button,
    HStack,
    Text,
    VStack,
} from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { StakingDaysLabel } from './StakingDaysLabel';
import {
    StakingDetailModalStep,
    StakingManagementModalStepIndicator,
} from './StakingManagementModalStepIndicator';

type StakingManagementPendingStakeModalProps = {
    ref: BottomSheetModalRef;
    accountKey: AccountKey;
    onClose: () => void;
};

const gotItButtonStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp24,
}));

const amountsStyle = prepareNativeStyle(() => ({
    alignItems: 'flex-end',
}));

const backgroundStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillRaised,
}));

export const StakingManagementPendingStakeModal = ({
    ref,
    accountKey,
    onClose,
}: StakingManagementPendingStakeModalProps) => {
    const { applyStyle } = useNativeStyles();
    const { networkSymbol } = parseAccountKey(accountKey);

    const { productId, totals } = useStakingAccountPosition(accountKey);
    const isStakeConfirming = useSelector((state: StakingRootState) =>
        selectIsStakingOperationPending(state, accountKey, 'stake'),
    );
    const { entryPeriodDays } = useStakingPeriods(productId);

    // The first activation dates the stake; a position that cannot date it shows the entry period.
    const daysUntilActivation = useStakingActivationDays(accountKey);
    const daysUntilActive = daysUntilActivation ?? entryPeriodDays;

    const totalStakePending = formatStakingAmount({ amount: totals.pending, networkSymbol });

    const currentStep: StakingDetailModalStep = (() => {
        if (isStakeConfirming) return StakingDetailModalStep.TransactionConfirmed;
        if (isPositiveBalance(totalStakePending)) return StakingDetailModalStep.InProgress;

        return StakingDetailModalStep.Completed;
    })();

    const isSolanaStaking = getNetworkType(networkSymbol) === 'solana';

    const inProgressLabel = (
        <StakingDaysLabel
            days={daysUntilActive}
            withDaysId={
                isSolanaStaking
                    ? 'earn.stakingManagementScreen.pendingItemModal.sol.stepWarmUpPeriod'
                    : 'earn.stakingManagementScreen.pendingItemModal.stepEntryPeriod'
            }
            withoutDaysId={
                isSolanaStaking
                    ? 'earn.stakingManagementScreen.pendingItemModal.sol.stepWarmUpPeriodWithoutDays'
                    : 'earn.stakingManagementScreen.pendingItemModal.stepEntryPeriodWithoutDays'
            }
        />
    );

    const completedLabel = isSolanaStaking ? (
        <Translation id="earn.stakingManagementScreen.pendingItemModal.sol.stepStakedReceivingRewards" />
    ) : (
        <Translation id="earn.stakingManagementScreen.pendingItemModal.stepStakedReceivingRewards" />
    );

    return (
        <BottomSheetModal
            ref={ref}
            bottomSheetCustomProps={{ backgroundStyle: applyStyle(backgroundStyle) }}
        >
            <HStack justifyContent="space-between" alignItems="center" marginVertical="sp8">
                <Text variant="headline-sm">
                    <Translation id="earn.stakingManagementScreen.pendingStakesItem.modalTitle" />
                </Text>
                <VStack style={applyStyle(amountsStyle)} spacing="sp2">
                    <ExactCryptoAmountFormatter
                        value={totalStakePending}
                        symbol={networkSymbol}
                        maxDisplayedDecimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
                        color="contentPrimary"
                        variant="body-sm"
                    />
                    <HStack spacing="sp2">
                        <Text color="contentSecondary" variant="body-sm">
                            ≈
                        </Text>
                        <CryptoToFiatAmountFormatter
                            value={totalStakePending}
                            symbol={networkSymbol}
                            color="contentSecondary"
                            variant="body-sm"
                            isBalance
                        />
                    </HStack>
                </VStack>
            </HStack>

            <StakingManagementModalStepIndicator
                currentStep={currentStep}
                inProgressLabel={inProgressLabel}
                completedLabel={completedLabel}
            />

            <Button onPress={onClose} style={applyStyle(gotItButtonStyle)}>
                <Text variant="body-md-strong" color="contentButtonBrandPrimary">
                    <Translation id="earn.stakingManagementScreen.pendingItemModal.gotIt" />
                </Text>
            </Button>
        </BottomSheetModal>
    );
};
