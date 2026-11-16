import { useSelector } from 'react-redux';

import {
    type StakingAccountProductRootState,
    type StakingRootState,
    formatStakingAmount,
    getStakingDaysUntil,
    selectIsStakingOperationPending,
    selectStakingAccountProductDescriptor,
    selectStakingAccountTotals,
    selectStakingPosition,
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
import { useNow } from '@trezor/react-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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

const DAY_COUNT_REFRESH_INTERVAL_MS = 60 * 60 * 1000;

export const StakingManagementPendingStakeModal = ({
    ref,
    accountKey,
    onClose,
}: StakingManagementPendingStakeModalProps) => {
    const { applyStyle } = useNativeStyles();
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
    const isStakeConfirming = useSelector((state: StakingRootState) =>
        selectIsStakingOperationPending(state, accountKey, 'stake'),
    );
    const { entryPeriodDays } = useStakingPeriods(productId);
    const now = useNow(DAY_COUNT_REFRESH_INTERVAL_MS);

    const totalStakePending = formatStakingAmount({ amount: totals.pending, networkSymbol });

    // The first activation dates the stake; a position that cannot date it shows the entry period.
    const activationAt = position?.activations[0]?.availableAt ?? null;
    const daysUntilActive =
        activationAt === null ? entryPeriodDays : getStakingDaysUntil(activationAt, now);

    const currentStep: StakingDetailModalStep = (() => {
        if (isStakeConfirming) return StakingDetailModalStep.TransactionConfirmed;
        if (isPositiveBalance(totalStakePending)) return StakingDetailModalStep.InProgress;

        return StakingDetailModalStep.Completed;
    })();

    const isSolanaStaking = getNetworkType(networkSymbol) === 'solana';

    const inProgressLabel = (() => {
        if (isSolanaStaking) {
            return daysUntilActive === null ? (
                <Translation id="earn.stakingManagementScreen.pendingItemModal.sol.stepWarmUpPeriodWithoutDays" />
            ) : (
                <Translation
                    id="earn.stakingManagementScreen.pendingItemModal.sol.stepWarmUpPeriod"
                    values={{ days: daysUntilActive }}
                />
            );
        }

        return daysUntilActive === null ? (
            <Translation id="earn.stakingManagementScreen.pendingItemModal.stepEntryPeriodWithoutDays" />
        ) : (
            <Translation
                id="earn.stakingManagementScreen.pendingItemModal.stepEntryPeriod"
                values={{ days: daysUntilActive }}
            />
        );
    })();

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
