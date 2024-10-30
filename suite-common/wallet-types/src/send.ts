import { AccountKey, TokenAddress } from './account';

export type SendFormDraftKey =
    | AccountKey
    | (`${AccountKey}-${TokenAddress}` & { __type: 'SendFormDraftKey' });
