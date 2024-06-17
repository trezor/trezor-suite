import { UseFormReturn } from 'react-hook-form';

import { BaseStakeContextValues } from '@suite-common/wallet-core';
import { StakeFormState } from '@suite-common/wallet-types';

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
