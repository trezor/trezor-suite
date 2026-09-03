import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { isSupportedSolStakingNetworkSymbol } from '@suite-common/staking';
import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Button,
    HStack,
    Text,
    VStack,
} from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    type NativeStakingRootState,
    selectClaimableAmountByAccountKey,
    selectUnstakingBalanceByAccountKey,
    selectUnstakingPeriodInDaysByAccountKey,
    useSelector,
} from '@suite-native/staking';
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
    const symbol = useAccountsSelector(state => selectAccountNetworkSymbol(state, accountKey));
    const claimableAmount =
        useSelector((state: NativeStakingRootState) =>
            selectClaimableAmountByAccountKey(state, accountKey),
        ) ?? '0';
    const unstakingBalance =
        useSelector((state: NativeStakingRootState) =>
            selectUnstakingBalanceByAccountKey(state, accountKey),
        ) ?? '0';
    const unstakingPeriodInDays = useSelector((state: NativeStakingRootState) =>
        selectUnstakingPeriodInDaysByAccountKey(state, accountKey),
    );

    const currentStep: StakingDetailModalStep = (() => {
        if (isPositiveBalance(unstakingBalance)) return StakingDetailModalStep.InProgress;
        if (isPositiveBalance(claimableAmount)) return StakingDetailModalStep.Completed;

        return StakingDetailModalStep.TransactionConfirmed;
    })();

    const isSolanaStaking = !!symbol && isSupportedSolStakingNetworkSymbol(symbol);

    const inProgressLabel = isSolanaStaking ? (
        <Translation
            id="earn.stakingManagementScreen.pendingItemModal.sol.stepCoolDownPeriod"
            values={{ days: unstakingPeriodInDays }}
        />
    ) : (
        <Translation
            id="earn.stakingManagementScreen.pendingItemModal.stepWithdrawalPeriod"
            values={{ days: unstakingPeriodInDays }}
        />
    );

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
                {!!symbol && (
                    <VStack style={applyStyle(amountsStyle)} spacing="sp2">
                        <CryptoAmountFormatter
                            value={unstakingBalance}
                            symbol={symbol}
                            decimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
                            color="contentPrimary"
                            variant="body-sm"
                        />
                        <HStack spacing="sp2">
                            <Text color="contentSecondary" variant="body-sm">
                                ≈
                            </Text>
                            <CryptoToFiatAmountFormatter
                                value={unstakingBalance}
                                symbol={symbol}
                                color="contentSecondary"
                                variant="body-sm"
                                isBalance
                            />
                        </HStack>
                    </VStack>
                )}
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
