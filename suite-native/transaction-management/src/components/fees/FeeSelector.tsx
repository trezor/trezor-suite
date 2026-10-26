import { BannerInline, Box } from '@suite-native/atoms';

import { FeeSummaryCard } from './FeeSummaryCard';
import { FeesBottomSheet } from './FeesBottomSheet';
import { TronFeeSummaryCard } from './TronFeeSummaryCard/TronFeeSummaryCard';
import { type CustomFeeLevelBuilder } from '../../hooks/fees/useCustomFee';
import { type UseFeeSelectorParams, useFeeSelector } from '../../hooks/fees/useFeeSelector';

export type FeeSelectorProps = UseFeeSelectorParams & { getCustomFeeLevel?: CustomFeeLevelBuilder };

export const FeeSelector = (props: FeeSelectorProps) => {
    const {
        form,
        fee,
        feeLevels,
        areFeesLoading,
        isSubmittable,
        symbol,
        networkType,
        isTrc20,
        feeLimitSunOverride,
        shouldShowFeeUnavailableAlert,
        feeUnavailableErrorTitle,
        bottomSheetRef,
        closeModal,
        snapshotRef,
        confirmedRef,
        handleOpen,
        handleConfirm,
    } = useFeeSelector(props);

    const { accountKey, tokenContract, formDraft } = props;

    if (!symbol || !networkType) return null;

    return (
        <>
            {networkType === 'tron' ? (
                <TronFeeSummaryCard
                    accountKey={accountKey}
                    onPress={isTrc20 ? handleOpen : undefined}
                    testID="@transactionManagement/fee-selector-card"
                    feeLimitSunOverride={feeLimitSunOverride}
                    supportsAdjustableFees={isTrc20}
                />
            ) : (
                <FeeSummaryCard
                    fee={fee}
                    symbol={symbol}
                    networkType={networkType}
                    areFeesLoading={areFeesLoading}
                    onPress={handleOpen}
                    testID="@transactionManagement/fee-selector-card"
                    withCaret
                />
            )}
            {shouldShowFeeUnavailableAlert && feeUnavailableErrorTitle && (
                <Box marginTop="sp8" testID="@transactionManagement/fee-unavailable-alert">
                    <BannerInline intent="critical" title={feeUnavailableErrorTitle} />
                </Box>
            )}
            <FeesBottomSheet
                ref={bottomSheetRef}
                form={form}
                accountKey={accountKey}
                feeLevels={feeLevels}
                symbol={symbol}
                networkType={networkType}
                tokenContract={tokenContract}
                areFeesLoading={areFeesLoading}
                isSubmittable={isSubmittable}
                formDraft={formDraft}
                getCustomFeeLevel={props.getCustomFeeLevel}
                snapshotRef={snapshotRef}
                confirmedRef={confirmedRef}
                onConfirm={handleConfirm}
                closeModal={closeModal}
            />
        </>
    );
};
