import type { UseFormReturn } from 'react-hook-form';

import type { BaseStakeContextValues } from '@suite-common/wallet-core';
import type { StakeFormState } from '@suite-common/wallet-types';

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
