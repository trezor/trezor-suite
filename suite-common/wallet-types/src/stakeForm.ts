import { type StakeType } from './ethereumStaking';
import { type FormState } from './sendForm';

export interface StakeFormState extends FormState {
    fiatInput?: string;
    cryptoInput?: string;
    stakeType: StakeType;
}
