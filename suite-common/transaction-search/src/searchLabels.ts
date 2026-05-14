import { type TxTargetId } from '@suite-common/wallet-types';

/** @deprecated hopefully Branded type one day */
export type TxId = string;

/** @deprecated hopefully Branded type one day */
export type Address = string;

export type SearchAccountOutputLabels = Map<TxTargetId, string>;

export type SearchOutputLabels = Map<TxId, SearchAccountOutputLabels>;

export interface SearchAccountLabels {
    accountLabel: string | null;
    outputLabels: SearchOutputLabels;
    addressLabels: Map<Address, string>;
}
