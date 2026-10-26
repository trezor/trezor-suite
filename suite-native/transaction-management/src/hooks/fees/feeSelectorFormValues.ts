import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import {
    type FeeLevelLabel,
    type FormState,
    type GeneralPrecomposedLevels,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';

import { getReferenceFeeLevel } from './referenceFeeLevel';
import { type FeesFormValues } from '../../feesFormSchema';
import { getFeeValue } from '../../utils';

type FeeSelectorFormValuesParams = {
    networkType?: NetworkType;
    symbol?: NetworkSymbol;
    selectedFee?: FeeLevelLabel;
    selectedFeePerUnit?: string;
    formDraft: FormState | null | undefined;
    feeLevels: GeneralPrecomposedLevels;
    previousValues: FeesFormValues;
};

export const getFeeSelectorFormValues = ({
    networkType,
    symbol,
    selectedFee,
    selectedFeePerUnit,
    formDraft,
    feeLevels,
    previousValues,
}: FeeSelectorFormValuesParams): FeesFormValues => {
    const selectedLevel = selectedFee ? feeLevels[selectedFee] : undefined;
    const normalFee = isFinalPrecomposedTransaction(selectedLevel)
        ? selectedLevel
        : getReferenceFeeLevel(feeLevels);
    const customDraft = selectedFee === 'custom' ? formDraft : undefined;

    return {
        feeLevel: selectedFee ?? 'normal',
        customFeePerUnit:
            getFeeValue({
                feeRate:
                    customDraft?.feePerUnit ??
                    normalFee?.maxFeePerGas ??
                    normalFee?.feePerByte ??
                    selectedFeePerUnit ??
                    previousValues.customFeePerUnit,
                symbol,
            }) ?? previousValues.customFeePerUnit,
        customFeeLimit:
            networkType === 'tron'
                ? formDraft?.feeLimit ||
                  normalFee?.estimatedFeeLimit ||
                  previousValues.customFeeLimit
                : (customDraft?.feeLimit ??
                  normalFee?.feeLimit ??
                  formDraft?.feeLimit ??
                  previousValues.customFeeLimit),
        customMaxFeePerGas:
            customDraft?.maxFeePerGas ??
            normalFee?.maxFeePerGas ??
            formDraft?.maxFeePerGas ??
            previousValues.customMaxFeePerGas,
        customMaxPriorityFeePerGas:
            customDraft?.maxPriorityFeePerGas ??
            normalFee?.maxPriorityFeePerGas ??
            formDraft?.maxPriorityFeePerGas ??
            previousValues.customMaxPriorityFeePerGas,
    };
};
