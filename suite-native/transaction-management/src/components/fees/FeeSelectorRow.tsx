import { Pressable } from 'react-native';

import { InlineAlertBox } from '@suite-native/atoms';

import { FeeSummaryRow } from './FeeSummaryRow';
import { FeesBottomSheet } from './FeesBottomSheet';
import { TronFeeSummaryRow } from './TronFeeSummaryCard/TronFeeSummaryRow';
import { type UseFeeSelectorParams, useFeeSelector } from '../../hooks/fees/useFeeSelector';
import { useTronFeeBreakdown } from '../../hooks/fees/useTronFeeBreakdown';

type FeeSelectorRowProps = UseFeeSelectorParams;

const FEE_SELECTOR_ROW_TEST_ID = '@transactionManagement/fee-selector-row';

export const FeeSelectorRow = (props: FeeSelectorRowProps) => {
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

    const tronBreakdown = useTronFeeBreakdown({
        accountKey: props.accountKey,
        feeLimitSunOverride,
    });

    const { accountKey, tokenContract, formDraft } = props;

    if (!symbol || !networkType) {
        return null;
    }

    if (shouldShowFeeUnavailableAlert && feeUnavailableErrorTitle) {
        return <InlineAlertBox variant="critical" title={feeUnavailableErrorTitle} />;
    }

    const isTron = networkType === 'tron';
    const isPressable = !isTron || isTrc20;

    return (
        <>
            <Pressable
                onPress={isPressable ? handleOpen : undefined}
                testID={FEE_SELECTOR_ROW_TEST_ID}
            >
                {isTron && tronBreakdown ? (
                    <TronFeeSummaryRow
                        symbol={tronBreakdown.symbol}
                        networkType={tronBreakdown.networkType}
                        supportsAdjustableFees={isTrc20}
                        trxBurned={tronBreakdown.trxBurned}
                        areFeesLoading={tronBreakdown.areFeesLoading}
                        resourceLabel={tronBreakdown.resourceLabel}
                    />
                ) : (
                    <FeeSummaryRow
                        fee={fee}
                        symbol={symbol}
                        networkType={networkType}
                        areFeesLoading={areFeesLoading}
                        withCaret={!isTron}
                    />
                )}
            </Pressable>
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
