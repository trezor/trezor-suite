import { TxTargetId } from '@suite-common/wallet-types';

export type TxId = string; // Todo: hopefully Branded type one day
export type Address = string; // Todo: hopefully Branded type one day

export type SearchAccountOutputLabels = Map<TxTargetId, string>;

export type SearchOutputLabels = Map<TxId, SearchAccountOutputLabels>;

export interface SearchAccountLabels {
    accountLabel?: string;
    outputLabels: SearchOutputLabels;
    addressLabels: Map<Address, string>;
}
