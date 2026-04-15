import { type MutableRefObject, type RefObject, useCallback, useState } from 'react';

import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type FeeLevelLabel,
    type FormState,
    type GeneralPrecomposedLevels,
    type TokenAddress,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    ScreenFooterGradient,
    SegmentedControl,
} from '@suite-native/atoms';
import { Button } from '@suite-native/atoms';
import { Form, useFormState } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';

import { CustomFeeTabContent } from './CustomFee/CustomFeeTabContent';
import { FeeLabelTranslation } from './FeeLabelTranslation';
import { FeeOptionsList } from './FeeOptionList/FeeOptionsList';
import { TronFeeLimitContent } from './TronFeeLimitContent';
import { type FeesFormType, type FeesFormValues } from '../../feesFormSchema';
import { type CustomFeeParams } from '../../hooks';

type TabValue = 'standard' | 'custom';

type FeesBottomSheetProps = {
    ref: BottomSheetModalRef;
    form: FeesFormType;
    accountKey: AccountKey;
    feeLevels: GeneralPrecomposedLevels;
    symbol: NetworkSymbol;
    networkType: NetworkType;
    tokenContract?: TokenAddress;
    areFeesLoading: boolean;
    isSubmittable: boolean;
    formDraft: FormState | null | undefined;
    snapshotRef: RefObject<FeesFormValues | undefined>;
    confirmedRef: MutableRefObject<boolean>;
    onConfirm: (feeLevel: FeeLevelLabel, customParams?: CustomFeeParams) => void;
    closeModal: () => void;
};

const TAB_OPTIONS: Array<{ label: React.ReactNode; value: TabValue }> = [
    {
        label: <Translation id="transactionManagement.fees.tabs.standard" />,
        value: 'standard',
    },
    {
        label: <Translation id="transactionManagement.fees.tabs.custom" />,
        value: 'custom',
    },
];

const feeLevelToTab = (feeLevel: string): TabValue =>
    feeLevel === 'custom' ? 'custom' : 'standard';

export const FeesBottomSheet = ({
    ref,
    form,
    accountKey,
    feeLevels,
    symbol,
    networkType,
    tokenContract,
    areFeesLoading,
    isSubmittable: standardIsSubmittable,
    formDraft,
    snapshotRef,
    confirmedRef,
    onConfirm,
    closeModal,
}: FeesBottomSheetProps) => {
    const isTrc20 = networkType === 'tron' && tokenContract !== undefined;
    const showCustomTab = networkType !== 'solana' && !isTrc20;

    const estimatedFeeLimit = isFinalPrecomposedTransaction(feeLevels.normal)
        ? feeLevels.normal.estimatedFeeLimit
        : undefined;

    const [activeTab, setActiveTab] = useState<TabValue>(() =>
        showCustomTab ? feeLevelToTab(form.getValues('feeLevel')) : 'standard',
    );
    const [customIsSubmittable, setCustomIsSubmittable] = useState(false);

    const { getValues } = form;
    const { isDirty } = useFormState({ control: form.control });

    const tabIsSubmittable = activeTab === 'custom' ? customIsSubmittable : standardIsSubmittable;
    const currentIsSubmittable = isTrc20 ? customIsSubmittable : tabIsSubmittable;

    const isConfirmVisible = isDirty && currentIsSubmittable;

    const handleConfirm = useCallback(() => {
        confirmedRef.current = true;
        const values = getValues();

        if (isTrc20) {
            onConfirm('custom', {
                customFeeLimit: values.customFeeLimit,
            });
        } else if (activeTab === 'custom') {
            form.setValue('feeLevel', 'custom');
            onConfirm('custom', {
                customFeePerUnit: values.customFeePerUnit,
                customFeeLimit: values.customFeeLimit,
                customMaxFeePerGas: values.customMaxFeePerGas,
                customMaxPriorityFeePerGas: values.customMaxPriorityFeePerGas,
            });
        } else {
            onConfirm(values.feeLevel);
        }

        closeModal();
    }, [isTrc20, activeTab, confirmedRef, form, getValues, onConfirm, closeModal]);

    const handleDismiss = useCallback(() => {
        if (confirmedRef.current) {
            confirmedRef.current = false;

            return;
        }

        if (showCustomTab && snapshotRef.current?.feeLevel) {
            setActiveTab(feeLevelToTab(snapshotRef.current?.feeLevel));
        }

        form.reset(snapshotRef.current);
    }, [confirmedRef, form, snapshotRef, showCustomTab]);

    const confirmButtonTranslationId =
        isTrc20 || activeTab === 'custom'
            ? 'transactionManagement.fees.custom.bottomSheet.confirmButton'
            : 'transactionManagement.fees.confirmButton';

    return (
        <BottomSheetModal
            ref={ref}
            onClose={handleDismiss}
            onDismiss={handleDismiss}
            title={
                <FeeLabelTranslation networkType={networkType} supportsAdjustableFees={isTrc20} />
            }
            subtitle={<Translation id="transactionManagement.fees.description.body" />}
            isCloseDisplayed
            bottomSheetCustomProps={{
                enableDynamicSizing: false,
                snapPoints: ['95%'],
            }}
            footer={
                isConfirmVisible && (
                    <>
                        <ScreenFooterGradient />
                        <Box marginHorizontal="sp16" marginBottom="sp16">
                            <Button onPress={handleConfirm}>
                                <Translation id={confirmButtonTranslationId} />
                            </Button>
                        </Box>
                    </>
                )
            }
            testID="@transactionManagement/fees-bottom-sheet"
        >
            <Form form={form}>
                {showCustomTab && (
                    <Box marginBottom="sp16">
                        <SegmentedControl
                            options={TAB_OPTIONS}
                            selectedValue={activeTab}
                            onValueChange={setActiveTab}
                            testID="@transactionManagement/fees-tabs"
                        />
                    </Box>
                )}
                {isTrc20 && (
                    <TronFeeLimitContent
                        estimatedFeeLimit={estimatedFeeLimit}
                        onSubmittableChange={setCustomIsSubmittable}
                    />
                )}
                {!isTrc20 && activeTab === 'standard' && (
                    <FeeOptionsList
                        feeLevels={feeLevels}
                        symbol={symbol}
                        isLoading={areFeesLoading}
                    />
                )}
                {!isTrc20 && activeTab === 'custom' && (
                    <CustomFeeTabContent
                        accountKey={accountKey}
                        symbol={symbol}
                        formDraft={formDraft}
                        onSubmittableChange={setCustomIsSubmittable}
                    />
                )}
            </Form>
        </BottomSheetModal>
    );
};
