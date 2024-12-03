import { UseFormReturn, FormState as ReactHookFormState } from 'react-hook-form';

import type { Network } from '@suite-common/wallet-config';
import {
    Account,
    Rate,
    FeeInfo,
    StakeFormState,
    PrecomposedLevels,
} from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { FeeLevel } from '@trezor/connect';

export enum EverstakeEndpointType {
    PoolStats = 'poolStats',
    ValidatorsQueue = 'validatorsQueue',
}

export const EVERSTAKE_ENDPOINT_TYPES = {
    [EverstakeEndpointType.PoolStats]: 'stats',
    [EverstakeEndpointType.ValidatorsQueue]: 'validators/queue',
};

export interface ValidatorsQueue {
    validatorsEnteringNum?: number;
    validatorsExitingNum?: number;
    validatorsTotalCount?: number;
    validatorsPerEpoch?: number;
    validatorActivationTime?: number;
    validatorExitTime?: number;
    validatorWithdrawTime?: number;
    validatorAddingDelay?: number;
    updatedAt?: number;
}

export interface AmountLimitsString {
    currency: string;
    minCrypto?: string;
    maxCrypto?: string;
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
        isLessAmountForWithdrawalWarningShown: boolean;
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

export type UnstakeFormState = Omit<StakeFormState, 'setMaxOutputId'>;

export type UnstakeContextValues = UseFormReturn<UnstakeFormState> &
    BaseStakeContextValues & {
        formState: ReactHookFormState<StakeFormState>;
        onCryptoAmountChange: (amount: string) => Promise<void>;
        onFiatAmountChange: (amount: string) => void;
        onOptionChange: (amount: string) => Promise<void>;
        currentRate: Rate | undefined;
    };
