import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { moneroComposeTransaction } from './moneroComposeTransaction';
import type { moneroGetAddress } from './moneroGetAddress';
import type { moneroGetWatchKey } from './moneroGetWatchKey';
import type { moneroKeyImageSync } from './moneroKeyImageSync';
import type { moneroSendTransaction } from './moneroSendTransaction';
import type { moneroSignTransaction } from './moneroSignTransaction';
import type { moneroSyncKeyImages } from './moneroSyncKeyImages';

// Monero-specific operations
export const TrezorConnectMonero = Type.Object({
    moneroGetAddress: Type.Unsafe<typeof moneroGetAddress>(),
    moneroGetWatchKey: Type.Unsafe<typeof moneroGetWatchKey>(),
    moneroKeyImageSync: Type.Unsafe<typeof moneroKeyImageSync>(),
    moneroSignTransaction: Type.Unsafe<typeof moneroSignTransaction>(),
    moneroSendTransaction: Type.Unsafe<typeof moneroSendTransaction>(),
    moneroComposeTransaction: Type.Unsafe<typeof moneroComposeTransaction>(),
    moneroSyncKeyImages: Type.Unsafe<typeof moneroSyncKeyImages>(),
});
export type TrezorConnectMonero = Static<typeof TrezorConnectMonero>;
