import { UseFormReturn, FormState as ReactHookFormState } from 'react-hook-form';

import { FeeLevel } from '@trezor/connect';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { Network } from '@suite-common/wallet-config';

import { FeeInfo, PrecomposedLevels } from './transaction';
import { FormState } from './sendForm';
import { Account } from './account';
import { StakeType } from './stake';
import { Rate } from './fiatRates';

export interface AmountLimitsString {
    currency: string;
    minCrypto?: string;
    maxCrypto?: string;
    minFiat?: string;
    maxFiat?: string;
}

export interface StakeFormState extends FormState {
    fiatInput?: string;
    cryptoInput?: string;
    ethereumStakeType: StakeType;
}

export interface BaseStakeContextValues {
    account: Account;
    network: Network;
    localCurrency: FiatCurrencyCode;
    composedLevels?: PrecomposedLevels;
    isComposing: boolean;
    clearForm: () => void;
    signTx: () => Promise<void>;
    selectedFee: FeeLevel['label'];
    feeInfo: FeeInfo;
    changeFeeLevel: (level: FeeLevel['label']) => void;
}

export type StakeContextValues = UseFormReturn<StakeFormState> &
    BaseStakeContextValues & {
        formState: ReactHookFormState<StakeFormState>;
        removeDraft: (key: string) => void;
        isDraft: boolean;
        amountLimits: AmountLimitsString;
        isAmountForWithdrawalWarningShown: boolean;
        isAdviceForWithdrawalWarningShown: boolean;
        isConfirmModalOpen: boolean;
        onCryptoAmountChange: (amount: string) => void;
        onFiatAmountChange: (amount: string) => void;
        setMax: () => void;
        setRatioAmount: (divisor: number) => void;
        closeConfirmModal: () => void;
        onSubmit: () => void;
        currentRate: Rate | undefined;
        isLoading: boolean;
    };
