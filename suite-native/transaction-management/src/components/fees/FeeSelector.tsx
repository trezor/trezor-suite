import { BannerInline, Box } from '@suite-native/atoms';

import { FeeSummaryCard } from './FeeSummaryCard';
import { FeesBottomSheet } from './FeesBottomSheet';
import { TronFeeSummaryCard } from './TronFeeSummaryCard/TronFeeSummaryCard';
import { type UseFeeSelectorParams, useFeeSelector } from '../../hooks/fees/useFeeSelector';

export type FeeSelectorProps = UseFeeSelectorParams & {
    isLoading?: boolean;
};

export const FeeSelector = (props: FeeSelectorProps) => {
    const {
        form,
        fee,
        feeLevels,
        areFeesLoading: areNetworkFeesLoading,
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
    const areFeesLoading = areNetworkFeesLoading || !!props.isLoading;

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
            {!areFeesLoading && shouldShowFeeUnavailableAlert && feeUnavailableErrorTitle && (
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
                isSubmittable={isSubmittable && !areFeesLoading}
                formDraft={formDraft}
                snapshotRef={snapshotRef}
                confirmedRef={confirmedRef}
                onConfirm={handleConfirm}
                closeModal={closeModal}
            />
        </>
    );
};
