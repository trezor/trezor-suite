import { useSelector } from 'react-redux';

import {
    type StakingAccountProductRootState,
    type StakingRootState,
    formatStakingAmount,
    selectStakingAccountProductDescriptor,
    selectStakingAccountTotals,
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

import {
    StakingDetailModalStep,
    StakingManagementModalStepIndicator,
} from './StakingManagementModalStepIndicator';

type StakingManagementUnstakingModalProps = {
    ref: BottomSheetModalRef;
    accountKey: AccountKey;
    onClose: () => void;
};

const elementStyle = prepareNativeStyle(utils => ({
    marginVertical: utils.spacings.sp8,
}));

const gotItButtonStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp24,
}));

const amountsStyle = prepareNativeStyle(() => ({
    alignItems: 'flex-end',
}));

const backgroundStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillRaised,
}));

export const StakingManagementUnstakingModal = ({
    ref,
    accountKey,
    onClose,
}: StakingManagementUnstakingModalProps) => {
    const { applyStyle } = useNativeStyles();
    const { networkSymbol } = parseAccountKey(accountKey);

    const productId = useSelector(
        (state: StakingAccountProductRootState) =>
            selectStakingAccountProductDescriptor(state, accountKey)?.id ?? null,
    );
    const totals = useSelector((state: StakingRootState) =>
        selectStakingAccountTotals(state, accountKey),
    );
    const { exitPeriodDays } = useStakingPeriods(productId);

    const unstakingBalance = formatStakingAmount({ amount: totals.unstaking, networkSymbol });

    const withdrawableAmount = formatStakingAmount({
        amount: totals.withdrawable,
        networkSymbol,
    });

    const currentStep: StakingDetailModalStep = (() => {
        if (isPositiveBalance(unstakingBalance)) return StakingDetailModalStep.InProgress;
        if (isPositiveBalance(withdrawableAmount)) return StakingDetailModalStep.Completed;

        return StakingDetailModalStep.TransactionConfirmed;
    })();

    const isSolanaStaking = getNetworkType(networkSymbol) === 'solana';

    const inProgressLabel = (() => {
        if (isSolanaStaking) {
            return exitPeriodDays === null ? (
                <Translation id="earn.stakingManagementScreen.pendingItemModal.sol.stepCoolDownPeriodWithoutDays" />
            ) : (
                <Translation
                    id="earn.stakingManagementScreen.pendingItemModal.sol.stepCoolDownPeriod"
                    values={{ days: exitPeriodDays }}
                />
            );
        }

        return exitPeriodDays === null ? (
            <Translation id="earn.stakingManagementScreen.pendingItemModal.stepWithdrawalPeriodWithoutDays" />
        ) : (
            <Translation
                id="earn.stakingManagementScreen.pendingItemModal.stepWithdrawalPeriod"
                values={{ days: exitPeriodDays }}
            />
        );
    })();

    const completedLabel = isSolanaStaking ? (
        <Translation id="earn.stakingManagementScreen.pendingItemModal.sol.stepUnstakedReadyToClaim" />
    ) : (
        <Translation id="earn.stakingManagementScreen.pendingItemModal.stepReadyToClaim" />
    );

    return (
        <BottomSheetModal
            ref={ref}
            bottomSheetCustomProps={{ backgroundStyle: applyStyle(backgroundStyle) }}
        >
            <HStack
                justifyContent="space-between"
                alignItems="center"
                style={applyStyle(elementStyle)}
            >
                <Text variant="headline-sm">
                    <Translation id="earn.stakingManagementScreen.unstakingItem.modalTitle" />
                </Text>
                <VStack style={applyStyle(amountsStyle)} spacing="sp2">
                    <ExactCryptoAmountFormatter
                        value={unstakingBalance}
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
                            value={unstakingBalance}
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
