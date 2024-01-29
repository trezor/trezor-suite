import { UseFormReturn, FormState as ReactHookFormState } from 'react-hook-form';

import { BaseStakeContextValues, StakeFormState } from './stakeForm';
import { Rate } from './fiatRates';

export interface UnstakeFormState extends Omit<StakeFormState, 'setMaxOutputId'> {}

export type UnstakeContextValues = UseFormReturn<UnstakeFormState> &
    BaseStakeContextValues & {
        formState: ReactHookFormState<StakeFormState>;
        onCryptoAmountChange: (amount: string) => Promise<void>;
        onFiatAmountChange: (amount: string) => void;
        onOptionChange: (amount: string) => Promise<void>;
        currentRate: Rate | undefined;
    };
