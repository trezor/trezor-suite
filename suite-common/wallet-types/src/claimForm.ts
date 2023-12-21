import { UseFormReturn } from 'react-hook-form';

import { BaseStakeContextValues, StakeFormState } from './stakeForm';

export interface ClaimFormState
    extends Omit<
        StakeFormState,
        | 'amountLimits'
        | 'onCryptoAmountChange'
        | 'onFiatAmountChange'
        | 'setMaxOutputId'
        | 'fiatInput'
    > {}

export type ClaimContextValues = UseFormReturn<ClaimFormState> &
    BaseStakeContextValues & {
        onClaimChange: (amount: string) => Promise<void>;
    };
