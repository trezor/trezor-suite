import type { FormState as ReactHookFormState, UseFormReturn } from 'react-hook-form';

import {
    type AmountLimitsString,
    type BaseStakeContextValues,
    type Rate,
    type StakeFormState,
    type StakingLimits,
} from '@suite-common/wallet-types';

export type SupplyContextValues = UseFormReturn<StakeFormState> &
    BaseStakeContextValues & {
        methods: UseFormReturn<StakeFormState>;
        formState: ReactHookFormState<StakeFormState>;
        removeDraft: (key: string) => void;
        isDraft: boolean;
        amountLimits?: AmountLimitsString;
        isAmountForWithdrawalWarningShown: boolean;
        isLessAmountForWithdrawalWarningShown: boolean;
        showAdviceBanner: boolean;
        isConfirmModalOpen: boolean;
        stakingLimits: StakingLimits | null;
        onCryptoAmountChange: (amount: string) => void;
        onFiatAmountChange: (amount: string) => void;
        setMax: () => void;
        setRatioAmount: (divisor: number) => void;
        closeConfirmModal: () => void;
        onSubmit: () => void;
        currentRate: Rate | undefined;
        isLoading: boolean;
        currency?: 'crypto' | 'fiat';
        setCurrency: (currency: 'crypto' | 'fiat') => void;
        isStakingDisabled: boolean;
    };

export type WithdrawalFormState = Omit<StakeFormState, 'setMaxOutputId'>;

export type WithdrawalContextValues = UseFormReturn<WithdrawalFormState> &
    BaseStakeContextValues & {
        methods: UseFormReturn<WithdrawalFormState>;
        formState: ReactHookFormState<StakeFormState>;
        onCryptoAmountChange: (amount: string) => Promise<void>;
        onFiatAmountChange: (amount: string) => void;
        currentRate: Rate | undefined;
    };

export type StakeContextValues = SupplyContextValues;
export type UnstakeFormState = WithdrawalFormState;
export type UnstakeContextValues = WithdrawalContextValues;
