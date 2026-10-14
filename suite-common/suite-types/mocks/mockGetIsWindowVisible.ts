import { asGetter } from '@trezor/dependency-injection';

import { type GetIsWindowVisibleDep } from '../src';

export const mockGetIsWindowVisible = (): GetIsWindowVisibleDep['getIsWindowVisible'] =>
    asGetter(() => true);
