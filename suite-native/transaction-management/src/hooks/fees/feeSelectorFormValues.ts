import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import {
    type FeeLevelLabel,
    type FormState,
    type GeneralPrecomposedLevels,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';

import { getReferenceFeeLevel } from './referenceFeeLevel';
import { getDefaultFeeLimit } from './useFeesForm';
import { type FeesFormValues } from '../../feesFormSchema';
import { getFeeValue } from '../../utils';

type FeeSelectorFormValuesParams = {
    networkType?: NetworkType;
    symbol?: NetworkSymbol;
    selectedFee?: FeeLevelLabel;
    formDraft: FormState | null | undefined;
    feeLevels: GeneralPrecomposedLevels;
    previousValues: FeesFormValues;
};

export const getFeeSelectorFormValues = ({
    networkType,
    symbol,
    selectedFee,
    formDraft,
    feeLevels,
    previousValues,
}: FeeSelectorFormValuesParams): FeesFormValues => {
    const selectedLevel = selectedFee ? feeLevels[selectedFee] : undefined;
    const referenceFee = isFinalPrecomposedTransaction(selectedLevel)
        ? selectedLevel
        : getReferenceFeeLevel(feeLevels);
    const draftValues = {
        customFeePerUnit: formDraft?.feePerUnit,
        customFeeLimit: formDraft?.feeLimit,
        customMaxFeePerGas: formDraft?.maxFeePerGas,
        customMaxPriorityFeePerGas: formDraft?.maxPriorityFeePerGas,
    };
    const levelValues = {
        customFeePerUnit: referenceFee?.maxFeePerGas ?? referenceFee?.feePerByte,
        customFeeLimit: getDefaultFeeLimit(networkType, referenceFee),
        customMaxFeePerGas: referenceFee?.maxFeePerGas,
        customMaxPriorityFeePerGas: referenceFee?.maxPriorityFeePerGas,
    };
    const [confirmedValues, fallbackValues] =
        selectedFee === 'custom' ? [draftValues, levelValues] : [levelValues, draftValues];
    const trc20FeeLimit = networkType === 'tron' ? draftValues.customFeeLimit : undefined;
    const pick = (key: keyof typeof draftValues) =>
        confirmedValues[key] || fallbackValues[key] || previousValues[key];

    return {
        feeLevel: selectedFee ?? previousValues.feeLevel,
        customFeePerUnit:
            getFeeValue({ feeRate: pick('customFeePerUnit'), symbol }) ??
            previousValues.customFeePerUnit,
        customFeeLimit: trc20FeeLimit || pick('customFeeLimit'),
        customMaxFeePerGas: pick('customMaxFeePerGas'),
        customMaxPriorityFeePerGas: pick('customMaxPriorityFeePerGas'),
    };
};
