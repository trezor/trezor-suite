import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { wardFlushQueue } from './wardFlushQueue';
import type { wardGetEntry } from './wardGetEntry';
import type { wardQueueDeleteEntry } from './wardQueueDeleteEntry';
import type { wardQueueGetEntry } from './wardQueueGetEntry';
import type { wardQueueSetEntry } from './wardQueueSetEntry';
import type { wardResetApp } from './wardResetApp';
import type { wardSetEntry } from './wardSetEntry';

// WARD entry operations. The queue has its own calls, as it has its own wire messages: a write
// that applies now and a write the device merely holds are different operations with different
// results, and one method returning either would put that distinction beyond the caller's reach.
export const TrezorConnectWard = Type.Object({
    wardGetEntry: Type.Unsafe<typeof wardGetEntry>(),
    wardSetEntry: Type.Unsafe<typeof wardSetEntry>(),
    wardQueueSetEntry: Type.Unsafe<typeof wardQueueSetEntry>(),
    wardQueueGetEntry: Type.Unsafe<typeof wardQueueGetEntry>(),
    wardQueueDeleteEntry: Type.Unsafe<typeof wardQueueDeleteEntry>(),
    wardFlushQueue: Type.Unsafe<typeof wardFlushQueue>(),
    wardResetApp: Type.Unsafe<typeof wardResetApp>(),
});
export type TrezorConnectWard = Static<typeof TrezorConnectWard>;
