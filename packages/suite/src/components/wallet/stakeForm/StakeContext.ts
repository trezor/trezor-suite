import type { FormState as ReactHookFormState, UseFormReturn } from 'react-hook-form';

import {
    AmountLimitsString,
    BaseStakeContextValues,
    Rate,
    StakeFormState,
    StakingLimits,
} from '@suite-common/wallet-types';

export type StakeContextValues = UseFormReturn<StakeFormState> &
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

export type UnstakeFormState = Omit<StakeFormState, 'setMaxOutputId'>;

export type UnstakeContextValues = UseFormReturn<UnstakeFormState> &
    BaseStakeContextValues & {
        methods: UseFormReturn<UnstakeFormState>;
        formState: ReactHookFormState<StakeFormState>;
        onCryptoAmountChange: (amount: string) => Promise<void>;
        onFiatAmountChange: (amount: string) => void;
        currentRate: Rate | undefined;
    };
