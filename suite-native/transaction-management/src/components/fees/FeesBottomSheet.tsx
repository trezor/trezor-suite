import { useCallback, useRef, useState } from 'react';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import {
    AccountKey,
    FeeLevelLabel,
    FormState,
    GeneralPrecomposedLevels,
    PrecomposedTransactionFinal,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { BottomSheetModal, Box, Button, SegmentedControl, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { FeesFormType, FeesFormValues } from '../../feesFormSchema';
import { CustomFeeParams } from '../../hooks';
import { useCustomFee } from '../../hooks/fees/useCustomFee';
import { prefillCustomFeeFields } from '../../utils';
import { CustomFeeContent } from './CustomFee/CustomFeeContent';
import { FeeOptionsList } from './FeeOptionList/FeeOptionsList';
import { getFeeLabelTranslationId } from './feesLabelUtils';

type FeeTab = 'standard' | 'custom';

const feeTabOptions: Array<{ label: React.ReactNode; value: FeeTab }> = [
    {
        label: <Translation id="transactionManagement.fees.tabs.standard" />,
        value: 'standard',
    },
    {
        label: <Translation id="transactionManagement.fees.tabs.custom" />,
        value: 'custom',
    },
];

export type FeesBottomSheetProps = {
    bottomSheetRef: React.RefObject<BottomSheetModalMethods | null>;
    networkType: NetworkType;
    symbol: NetworkSymbol;
    feeLevels: GeneralPrecomposedLevels;
    selectedFeeLevel: FeeLevelLabel;
    areFeesLoading: boolean;
    accountKey: AccountKey;
    formDraft: FormState | null | undefined;
    form: FeesFormType;
    onFeeLevelChange: (feeLevel: FeeLevelLabel, customFeeParams?: CustomFeeParams) => void;
};

export const FeesBottomSheet = ({
    bottomSheetRef,
    networkType,
    symbol,
    feeLevels,
    selectedFeeLevel,
    areFeesLoading,
    accountKey,
    formDraft,
    form,
    onFeeLevelChange,
}: FeesBottomSheetProps) => {
    const isCustomFeeSupported = networkType !== 'solana';
    const isConfirmingRef = useRef(false);

    const [activeTab, setActiveTab] = useState<FeeTab>(
        selectedFeeLevel === 'custom' ? 'custom' : 'standard',
    );

    const snapshotRef = useRef<FeesFormValues | null>(null);

    const { feeValue, isFeeLoading, isErrorBoxVisible, isSubmittable } = useCustomFee({
        accountKey,
        formState: formDraft,
    });

    const currentFormFeeLevel = form.watch('feeLevel');

    const hasStandardChanged = snapshotRef.current
        ? currentFormFeeLevel !== snapshotRef.current.feeLevel
        : false;

    const hasCustomChanged = activeTab === 'custom' && isSubmittable;

    const showConfirmButton = activeTab === 'standard' ? hasStandardChanged : hasCustomChanged;

    const captureSnapshot = useCallback(() => {
        const currentLevel = form.getValues('feeLevel');

        if (currentLevel !== 'custom') {
            const selectedLevel = feeLevels[currentLevel];
            const fallbackLevel = feeLevels.normal;
            const finalLevel = isFinalPrecomposedTransaction(selectedLevel)
                ? (selectedLevel as PrecomposedTransactionFinal)
                : null;
            const level =
                finalLevel ??
                (isFinalPrecomposedTransaction(fallbackLevel)
                    ? (fallbackLevel as PrecomposedTransactionFinal)
                    : null);

            if (level) {
                prefillCustomFeeFields(form.setValue, level, networkType);
            }
        }

        snapshotRef.current = form.getValues();
        setActiveTab(selectedFeeLevel === 'custom' ? 'custom' : 'standard');
    }, [form, selectedFeeLevel, feeLevels, networkType]);

    const handleDismiss = useCallback(() => {
        if (snapshotRef.current && !isConfirmingRef.current) {
            form.reset(snapshotRef.current);
        }
        snapshotRef.current = null;
        isConfirmingRef.current = false;
    }, [form]);

    const handleConfirm = useCallback(() => {
        isConfirmingRef.current = true;
        const values = form.getValues();

        if (activeTab === 'standard') {
            onFeeLevelChange(values.feeLevel);
        } else {
            onFeeLevelChange('custom', {
                customFeePerUnit: values.customFeePerUnit,
                customFeeLimit: values.customFeeLimit,
                customMaxFeePerGas: values.customMaxFeePerGas,
                customMaxPriorityFeePerGas: values.customMaxPriorityFeePerGas,
            });
        }

        bottomSheetRef.current?.dismiss();
    }, [activeTab, bottomSheetRef, form, onFeeLevelChange]);

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            title={<Translation id={getFeeLabelTranslationId(networkType)} />}
            subtitle={<Translation id="transactionManagement.fees.description.body" />}
            isCloseDisplayed
            onDismiss={handleDismiss}
            bottomSheetCustomProps={{
                enableDynamicSizing: false,
                snapPoints: ['95%'],
                onChange: (index: number) => {
                    if (index >= 0 && !snapshotRef.current) {
                        captureSnapshot();
                    }
                },
            }}
        >
            <Form form={form}>
                <VStack flex={1} spacing="sp24" marginTop="sp24">
                    {isCustomFeeSupported && (
                        <SegmentedControl
                            options={feeTabOptions}
                            selectedValue={activeTab}
                            onValueChange={setActiveTab}
                            testID="@transactionManagement/fee-tabs"
                        />
                    )}
                    {activeTab === 'standard' ? (
                        <FeeOptionsList
                            feeLevels={feeLevels}
                            symbol={symbol}
                            isLoading={areFeesLoading}
                        />
                    ) : (
                        <CustomFeeContent
                            symbol={symbol}
                            feeValue={feeValue}
                            isFeeLoading={isFeeLoading}
                            isErrorBoxVisible={isErrorBoxVisible}
                        />
                    )}
                </VStack>
                {showConfirmButton && (
                    <Animated.View entering={SlideInDown} exiting={SlideOutDown}>
                        <Box marginTop="sp16">
                            <Button
                                testID="@transactionManagement/fee-confirm-button"
                                onPress={handleConfirm}
                            >
                                <Translation
                                    id={
                                        activeTab === 'custom'
                                            ? 'transactionManagement.fees.custom.bottomSheet.confirmButton'
                                            : 'transactionManagement.fees.confirmButton'
                                    }
                                />
                            </Button>
                        </Box>
                    </Animated.View>
                )}
            </Form>
        </BottomSheetModal>
    );
};
