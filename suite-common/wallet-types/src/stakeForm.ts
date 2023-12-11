import { UseFormReturn } from 'react-hook-form';

import { FormState as ReactHookFormState } from 'react-hook-form/dist/types/form';

import { FeeLevel } from '@trezor/connect';
import { Network } from '@trezor/suite/src/types/wallet';
import { AmountLimits } from '@trezor/suite/src/types/wallet/coinmarketCommonTypes';
import { FiatCurrencyCode } from '@suite-common/suite-config';

import { Output, PrecomposedLevels, RbfTransactionParams } from './transaction';
import { FormOptions } from './sendForm';
import { Account } from './account';

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
    ethereumStakeType?: 'stake' | 'unstake' | 'claim';
    options: FormOptions[];
    anonymityWarningChecked?: boolean;
}

export type StakeContextValues = UseFormReturn<StakeFormState> & {
    onSubmit: () => void;
    account: Account;
    network: Network;
    cryptoInputValue?: string;
    removeDraft: (key: string) => void;
    formState: ReactHookFormState<StakeFormState>;
    isDraft: boolean;
    amountLimits: AmountLimits;
    onCryptoAmountChange: (amount: string) => void;
    onFiatAmountChange: (amount: string) => void;
    localCurrency: FiatCurrencyCode;
    composedLevels?: PrecomposedLevels;
    isComposing: boolean;
    setMax: () => void;
    setRatioAmount: (divisor: number) => void;
    isAmountForWithdrawalWarningShown: boolean;
    isAdviceForWithdrawalWarningShown: boolean;
    // TODO: Implement fee switcher
    selectedFee: FeeLevel['label'];
    clearForm: () => void;
    isConfirmModalOpen: boolean;
    closeConfirmModal: () => void;
    signTx: () => Promise<void>;
};
