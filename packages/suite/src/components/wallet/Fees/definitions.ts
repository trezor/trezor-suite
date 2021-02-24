import { UseFormMethods } from 'react-hook-form';
import { FeeLevel } from 'trezor-connect';
import { Account } from '@wallet-types';
import { ExtendedMessageDescriptor } from '@suite-types';
import { FeeInfo, PrecomposedLevels } from '@wallet-types/sendForm';
import { TypedValidationRules } from '@wallet-types/form';

// Shared subset of 'react-hook-form' FormState
type FormState = UseFormMethods<{
    selectedFee?: FeeLevel['label'];
    feePerUnit?: string;
    feeLimit?: string;
    estimatedFeeLimit?: string;
}>;

export interface Props {
    account: Account;
    feeInfo: FeeInfo;
    register: (rules?: TypedValidationRules) => (ref: any) => void;
    setValue: FormState['setValue'];
    getValues: FormState['getValues'];
    errors: FormState['errors'];
    changeFeeLevel: (level: FeeLevel['label']) => void;
    changeFeePerUnit?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    changeFeeLimit?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    composedLevels?: PrecomposedLevels;
    showLabel?: boolean;
    label?: ExtendedMessageDescriptor['id'];
    rbfForm?: boolean;
}
