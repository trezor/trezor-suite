import { type MutableRefObject, type RefObject, useCallback, useEffect, useState } from 'react';

import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type FeeLevelLabel,
    type FormState,
    type GeneralPrecomposedLevels,
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

import { CustomFeeContent } from './CustomFee/CustomFeeContent';
import { FeeOptionsList } from './FeeOptionList/FeeOptionsList';
import { getFeeLabelTranslationId } from './feesLabelUtils';
import { type FeesFormType, type FeesFormValues } from '../../feesFormSchema';
import { type CustomFeeParams } from '../../hooks';
import { useCustomFee } from '../../hooks/fees/useCustomFee';

type TabValue = 'standard' | 'custom';

type FeesBottomSheetProps = {
    ref: BottomSheetModalRef;
    form: FeesFormType;
    accountKey: AccountKey;
    feeLevels: GeneralPrecomposedLevels;
    symbol: NetworkSymbol;
    networkType: NetworkType;
    areFeesLoading: boolean;
    isSubmittable: boolean;
    formDraft: FormState | null | undefined;
    snapshotRef: RefObject<FeesFormValues | undefined>;
    confirmedRef: MutableRefObject<boolean>;
    onConfirm: (feeLevel: FeeLevelLabel, customParams?: CustomFeeParams) => void;
    closeModal: () => void;
};

type CustomFeeTabContentProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    formDraft: FormState | null | undefined;
    onSubmittableChange: (isSubmittable: boolean) => void;
};

const CustomFeeTabContent = ({
    accountKey,
    symbol,
    formDraft,
    onSubmittableChange,
}: CustomFeeTabContentProps) => {
    const { feeValue, isFeeLoading, isErrorBoxVisible, isSubmittable } = useCustomFee({
        accountKey,
        formState: formDraft,
    });

    useEffect(() => {
        onSubmittableChange(isSubmittable);
    }, [isSubmittable, onSubmittableChange]);

    return (
        <CustomFeeContent
            symbol={symbol}
            feeValue={feeValue}
            isFeeLoading={isFeeLoading}
            isErrorBoxVisible={isErrorBoxVisible}
        />
    );
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

export const FeesBottomSheet = ({
    ref,
    form,
    accountKey,
    feeLevels,
    symbol,
    networkType,
    areFeesLoading,
    isSubmittable: standardIsSubmittable,
    formDraft,
    snapshotRef,
    confirmedRef,
    onConfirm,
    closeModal,
}: FeesBottomSheetProps) => {
    const [activeTab, setActiveTab] = useState<TabValue>('standard');
    const [customIsSubmittable, setCustomIsSubmittable] = useState(false);

    const { getValues } = form;
    const { isDirty } = useFormState({ control: form.control });

    const showCustomTab = networkType !== 'solana';

    const currentIsSubmittable =
        activeTab === 'custom' ? customIsSubmittable : standardIsSubmittable;

    const isConfirmVisible = isDirty && currentIsSubmittable;

    const handleConfirm = useCallback(() => {
        confirmedRef.current = true;
        const values = getValues();

        if (activeTab === 'custom') {
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
    }, [activeTab, confirmedRef, form, getValues, onConfirm, closeModal]);

    const handleDismiss = useCallback(() => {
        if (confirmedRef.current) {
            confirmedRef.current = false;

            return;
        }

        form.reset(snapshotRef.current);
    }, [confirmedRef, form, snapshotRef]);

    const titleKey = getFeeLabelTranslationId(networkType);
    const confirmButtonTranslationId =
        activeTab === 'custom'
            ? 'transactionManagement.fees.custom.bottomSheet.confirmButton'
            : 'transactionManagement.fees.confirmButton';

    return (
        <BottomSheetModal
            ref={ref}
            onClose={handleDismiss}
            onDismiss={handleDismiss}
            title={<Translation id={titleKey} />}
            subtitle={<Translation id="transactionManagement.fees.description.body" />}
            isCloseDisplayed
            bottomSheetCustomProps={{
                enableDynamicSizing: false,
                snapPoints: ['95%'],
            }}
            footer={
                isConfirmVisible ? (
                    <>
                        <ScreenFooterGradient />
                        <Box marginHorizontal="sp16" marginBottom="sp16">
                            <Button onPress={handleConfirm}>
                                <Translation id={confirmButtonTranslationId} />
                            </Button>
                        </Box>
                    </>
                ) : undefined
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
                {activeTab === 'standard' ? (
                    <FeeOptionsList
                        feeLevels={feeLevels}
                        symbol={symbol}
                        isLoading={areFeesLoading}
                    />
                ) : (
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
