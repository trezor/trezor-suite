import { type StakingProviderId } from '@suite-common/wallet-config';

import { type StakeType } from './ethereumStaking';
import { type FormState } from './sendForm';

export interface StakeFormState extends FormState {
    fiatInput?: string;
    cryptoInput?: string;
    stakeType: StakeType;
    /** Ethereum only. Drafts saved before providers existed have none and read as the default provider. */
    providerId?: StakingProviderId;
}
