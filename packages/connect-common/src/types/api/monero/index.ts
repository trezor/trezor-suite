import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { moneroGetAddress } from './moneroGetAddress';
import type { moneroGetWatchKey } from './moneroGetWatchKey';
import type { moneroKeyImageSync } from './moneroKeyImageSync';
import type { moneroSignTransaction } from './moneroSignTransaction';

// Monero-specific operations
export const TrezorConnectMonero = Type.Object({
    moneroGetAddress: Type.Unsafe<typeof moneroGetAddress>(),
    moneroGetWatchKey: Type.Unsafe<typeof moneroGetWatchKey>(),
    moneroKeyImageSync: Type.Unsafe<typeof moneroKeyImageSync>(),
    moneroSignTransaction: Type.Unsafe<typeof moneroSignTransaction>(),
});
export type TrezorConnectMonero = Static<typeof TrezorConnectMonero>;
