import { type Branded } from '@trezor/type-utils';

import { type AccountKey, type TokenAddress } from './account';

export type SendFormDraftKey =
    | AccountKey
    | (`${AccountKey}-${TokenAddress}` & Branded<'SendFormDraftKey'>);
