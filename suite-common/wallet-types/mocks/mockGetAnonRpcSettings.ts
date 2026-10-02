import { asGetter } from '@trezor/dependency-injection';

import { type GetAnonRpcSettingsDep } from '../src';

export const mockGetAnonRpcSettings = (): GetAnonRpcSettingsDep['getAnonRpcSettings'] =>
    asGetter(() => undefined);
