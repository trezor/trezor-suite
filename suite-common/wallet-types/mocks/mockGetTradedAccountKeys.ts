import { asGetter } from '@suite-common/dependency-injection';

import { type GetTradedAccountKeysDep } from '../src';

export const mockGetTradedAccountKeys = (): GetTradedAccountKeysDep['getTradedAccountKeys'] =>
    asGetter(() => []);
