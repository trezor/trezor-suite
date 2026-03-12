import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import {
    BottomSheetModal,
    BottomSheetModalRef,
    Button,
    HStack,
    Text,
    VStack,
} from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    NativeStakingRootState,
    selectIsStakeConfirmingByAccountKey,
    selectIsStakePendingByAccountKey,
    selectPendingDepositedBalanceByAccountKey,
    selectUnstakingPeriodInDaysByAccountKey,
    useSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
}));

export const StakingManagementPendingStakeModal = ({
    ref,
    accountKey,
    onClose,
}: StakingManagementPendingStakeModalProps) => {
    const { applyStyle } = useNativeStyles();
    const symbol = useAccountsSelector(state => selectAccountNetworkSymbol(state, accountKey));
    const isStakeConfirming = useSelector((state: NativeStakingRootState) =>
        selectIsStakeConfirmingByAccountKey(state, accountKey),
    );
    const isStakePending = useSelector((state: NativeStakingRootState) =>
        selectIsStakePendingByAccountKey(state, accountKey),
    );
    const pendingDepositedBalance = useSelector((state: NativeStakingRootState) =>
        selectPendingDepositedBalanceByAccountKey(state, accountKey),
    );
    const unstakingPeriodInDays = useSelector((state: NativeStakingRootState) =>
        selectUnstakingPeriodInDaysByAccountKey(state, accountKey),
    );

    const currentStep: StakingDetailModalStep = (() => {
        if (isStakeConfirming) return StakingDetailModalStep.TransactionConfirmed;
        if (isStakePending) return StakingDetailModalStep.InProgress;

        return StakingDetailModalStep.Completed;
    })();

    const inProgressLabel = (
        <Translation
            id="earn.stakingManagementScreen.pendingItemModal.stepEntryPeriod"
            values={{ days: unstakingPeriodInDays }}
        />
    );

    const completedLabel = (
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
                {!!symbol && (
                    <VStack style={applyStyle(amountsStyle)} spacing="sp2">
                        <CryptoAmountFormatter
                            value={pendingDepositedBalance}
                            symbol={symbol}
                            decimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
                            color="textDefault"
                            variant="body-sm"
                        />
                        <HStack spacing="sp2">
                            <Text color="textSubdued" variant="body-sm">
                                ≈
                            </Text>
                            <CryptoToFiatAmountFormatter
                                value={pendingDepositedBalance}
                                symbol={symbol}
                                color="textSubdued"
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
                <Text variant="body-md-strong" color="textOnPrimary">
                    <Translation id="earn.stakingManagementScreen.pendingItemModal.gotIt" />
                </Text>
            </Button>
        </BottomSheetModal>
    );
};
