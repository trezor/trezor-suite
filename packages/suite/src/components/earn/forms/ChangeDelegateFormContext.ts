import type { FormState as ReactHookFormState, UseFormReturn } from 'react-hook-form';

import {
    type BaseStakeContextValues,
    type ChangeDelegateFormState,
    type StakeFormState,
} from '@suite-common/wallet-types';

export type ChangeDelegateContextValues = UseFormReturn<ChangeDelegateFormState> &
    BaseStakeContextValues & {
        methods: UseFormReturn<ChangeDelegateFormState>;
        formState: ReactHookFormState<StakeFormState>;
    };
