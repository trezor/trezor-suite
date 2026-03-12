import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
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
    selectClaimableAmountByAccountKey,
    selectUnstakingBalanceByAccountKey,
    selectUnstakingPeriodInDaysByAccountKey,
    useSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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

export const StakingManagementUnstakingModal = ({
    ref,
    accountKey,
    onClose,
}: StakingManagementUnstakingModalProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const symbol = useAccountsSelector(state => selectAccountNetworkSymbol(state, accountKey));
    const claimableAmount = useSelector((state: NativeStakingRootState) =>
        selectClaimableAmountByAccountKey(state, accountKey),
    );
    const unstakingBalance = useSelector((state: NativeStakingRootState) =>
        selectUnstakingBalanceByAccountKey(state, accountKey),
    );
    const unstakingPeriodInDays = useSelector((state: NativeStakingRootState) =>
        selectUnstakingPeriodInDaysByAccountKey(state, accountKey),
    );

    const currentStep: StakingDetailModalStep = (() => {
        if (isPositiveBalance(claimableAmount)) return StakingDetailModalStep.Completed;
        if (isPositiveBalance(unstakingBalance)) return StakingDetailModalStep.InProgress;

        return StakingDetailModalStep.TransactionConfirmed;
    })();

    const inProgressLabel = (
        <Translation
            id="earn.stakingManagementScreen.pendingItemModal.stepWithdrawalPeriod"
            values={{ days: unstakingPeriodInDays }}
        />
    );

    const completedLabel = (
        <Translation id="earn.stakingManagementScreen.pendingItemModal.stepReadyToClaim" />
    );

    return (
        <BottomSheetModal
            ref={ref}
            bottomSheetCustomProps={{
                backgroundStyle: { backgroundColor: utils.colors.backgroundSurfaceElevation1 },
            }}
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
                            color="textDefault"
                            variant="body-sm"
                        />
                        <HStack spacing="sp2">
                            <Text color="textSubdued" variant="body-sm">
                                ≈
                            </Text>
                            <CryptoToFiatAmountFormatter
                                value={unstakingBalance}
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
