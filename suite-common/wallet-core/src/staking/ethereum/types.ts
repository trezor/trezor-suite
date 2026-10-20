import { type StakeFormState } from '@suite-common/wallet-types';

export type EthereumStakingTransactionDraft = {
    to: string;
    value: string;
    gasLimit: number | string;
    data: string;
};

export interface GetStakeFormsDefaultValuesParams {
    address: string;
    stakeType: StakeFormState['stakeType'];
    amount?: string;
    providerId?: StakeFormState['providerId'];
}
