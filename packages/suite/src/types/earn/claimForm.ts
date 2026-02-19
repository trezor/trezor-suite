import { UseFormReturn } from 'react-hook-form';

import { BaseStakeContextValues, StakeFormState } from '@suite-common/wallet-types';

export type ClaimFormState = Omit<
    StakeFormState,
    'amountLimits' | 'onCryptoAmountChange' | 'onFiatAmountChange' | 'setMaxOutputId' | 'fiatInput'
>;

export type ClaimContextValues = UseFormReturn<ClaimFormState> &
    BaseStakeContextValues & {
        onClaimChange: (amount: string) => Promise<void>;
    } & {
        methods: UseFormReturn<ClaimFormState>;
        isClaimingDisabled?: boolean;
    };
