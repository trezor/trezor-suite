import { asGetter } from '@trezor/dependency-injection';

import { type GetTradedAccountKeysDep } from '../src';

export const mockGetTradedAccountKeys = (): GetTradedAccountKeysDep['getTradedAccountKeys'] =>
    asGetter(() => []);
