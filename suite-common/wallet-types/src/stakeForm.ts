import { UseFormReturn } from 'react-hook-form';

import { FormState as ReactHookFormState } from 'react-hook-form/dist/types/form';

import { FeeLevel } from '@trezor/connect';
import { Network } from '@trezor/suite/src/types/wallet';
import { AmountLimits } from '@trezor/suite/src/types/wallet/coinmarketCommonTypes';
import { FiatCurrencyCode } from '@suite-common/suite-config';

import { Output, PrecomposedLevels, RbfTransactionParams } from './transaction';
import { FormOptions } from './sendForm';
import { Account } from './account';
import { StakeType } from './stake';

export interface StakeFormState {
    fiatInput?: string;
    cryptoInput?: string;
    setMaxOutputId?: number;
    outputs: Output[]; // output arrays, each element is corresponding with single Output item
    estimatedFeeLimit?: string; // ethereum only (gasLimit)
    feePerUnit: string; // bitcoin/ethereum/ripple custom fee field (satB/gasPrice/drops)
    feeLimit: string; // ethereum only (gasLimit)
    selectedFee?: FeeLevel['label'];
    rbfParams?: RbfTransactionParams;
    ethereumDataHex?: string;
    ethereumNonce?: string; // TODO: ethereum RBF
    ethereumDataAscii?: string;
    ethereumAdjustGasLimit?: string; // if used, final gas limit = estimated limit * ethereumAdjustGasLimit
    ethereumStakeType: StakeType;
    options: FormOptions[];
    anonymityWarningChecked?: boolean;
}

export interface BaseStakeContextValues {
    account: Account;
    network: Network;
    localCurrency: FiatCurrencyCode;
    composedLevels?: PrecomposedLevels;
    isComposing: boolean;
    clearForm: () => void;
    signTx: () => Promise<void>;
    // TODO: Implement fee switcher
    selectedFee: FeeLevel['label'];
}

export type StakeContextValues = UseFormReturn<StakeFormState> &
    BaseStakeContextValues & {
        formState: ReactHookFormState<StakeFormState>;
        removeDraft: (key: string) => void;
        isDraft: boolean;
        amountLimits: AmountLimits;
        isAmountForWithdrawalWarningShown: boolean;
        isAdviceForWithdrawalWarningShown: boolean;
        isConfirmModalOpen: boolean;
        onCryptoAmountChange: (amount: string) => void;
        onFiatAmountChange: (amount: string) => void;
        setMax: () => void;
        setRatioAmount: (divisor: number) => void;
        closeConfirmModal: () => void;
        onSubmit: () => void;
    };
