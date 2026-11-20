import type { TokenAddress } from '@suite-common/tokens';
import { type Branded } from '@trezor/type-utils';

import { type AccountKey } from './account';

export type SendFormDraftKey =
    AccountKey | (`${AccountKey}-${TokenAddress}` & Branded<'SendFormDraftKey'>);
