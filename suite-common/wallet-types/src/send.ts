import { Branded } from '@trezor/type-utils';

import { AccountKey, TokenAddress } from './account';

export type SendFormDraftKey =
    | AccountKey
    | (`${AccountKey}-${TokenAddress}` & Branded<'SendFormDraftKey'>);
