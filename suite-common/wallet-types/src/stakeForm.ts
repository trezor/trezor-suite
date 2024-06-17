import { StakeType } from './stake';
import { FormState } from './sendForm';

export interface StakeFormState extends FormState {
    fiatInput?: string;
    cryptoInput?: string;
    ethereumStakeType: StakeType;
}
