import { InlineAlertBox } from '@suite-native/atoms';

import { FeeSummaryCard } from './FeeSummaryCard';
import { FeesBottomSheet } from './FeesBottomSheet';
import { TronFeeSummaryCard } from './TronFeeSummaryCard/TronFeeSummaryCard';
import { type UseFeeSelectorParams, useFeeSelector } from '../../hooks/fees/useFeeSelector';

type FeeSelectorProps = UseFeeSelectorParams;

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

    if (shouldShowFeeUnavailableAlert && feeUnavailableErrorTitle) {
        return <InlineAlertBox intent="critical" title={feeUnavailableErrorTitle} />;
    }

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
                snapshotRef={snapshotRef}
                confirmedRef={confirmedRef}
                onConfirm={handleConfirm}
                closeModal={closeModal}
            />
        </>
    );
};
