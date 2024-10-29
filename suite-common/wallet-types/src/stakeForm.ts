import { StakeType } from './ethereumStaking';
import { FormState } from './sendForm';

export interface StakeFormState extends FormState {
    fiatInput?: string;
    cryptoInput?: string;
    ethereumStakeType: StakeType;
}
