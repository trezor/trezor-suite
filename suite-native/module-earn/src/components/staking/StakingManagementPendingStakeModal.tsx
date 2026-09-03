import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import {
    isSupportedSolStakingNetworkSymbol,
    selectAccountByKey,
    selectAccountNetworkSymbol,
    selectAccountStakeTransactions,
    useAccountsSelector,
    useStakingEntryPeriodEstimateInDays,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
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
    selectIsStakeConfirmingByAccountKey,
    selectIsStakePendingByAccountKey,
    selectTotalStakePendingByAccountKey,
    useSelector,
} from '@suite-native/staking';
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

export const StakingManagementPendingStakeModal = ({
    ref,
    accountKey,
    onClose,
}: StakingManagementPendingStakeModalProps) => {
    const { applyStyle } = useNativeStyles();
    const symbol = useAccountsSelector(state => selectAccountNetworkSymbol(state, accountKey));
    const account = useSelector((state: NativeStakingRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const stakeTxs = useSelector((state: NativeStakingRootState) =>
        selectAccountStakeTransactions(state, accountKey),
    );
    const isStakeConfirming = useSelector((state: NativeStakingRootState) =>
        selectIsStakeConfirmingByAccountKey(state, accountKey),
    );
    const isStakePending = useSelector((state: NativeStakingRootState) =>
        selectIsStakePendingByAccountKey(state, accountKey),
    );
    const totalStakePending =
        useSelector((state: NativeStakingRootState) =>
            selectTotalStakePendingByAccountKey(state, accountKey),
        ) ?? '0';
    const entryPeriodEstimateInDays = useStakingEntryPeriodEstimateInDays({ account, stakeTxs });

    const currentStep: StakingDetailModalStep = (() => {
        if (isStakeConfirming) return StakingDetailModalStep.TransactionConfirmed;
        if (isStakePending) return StakingDetailModalStep.InProgress;

        return StakingDetailModalStep.Completed;
    })();

    const isSolanaStaking = !!symbol && isSupportedSolStakingNetworkSymbol(symbol);

    const inProgressLabel = isSolanaStaking ? (
        <Translation
            id="earn.stakingManagementScreen.pendingItemModal.sol.stepWarmUpPeriod"
            values={{ days: entryPeriodEstimateInDays }}
        />
    ) : (
        <Translation
            id="earn.stakingManagementScreen.pendingItemModal.stepEntryPeriod"
            values={{ days: entryPeriodEstimateInDays }}
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
                {!!symbol && (
                    <VStack style={applyStyle(amountsStyle)} spacing="sp2">
                        <CryptoAmountFormatter
                            value={totalStakePending}
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
                                value={totalStakePending}
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
