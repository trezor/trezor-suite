import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { wardQueueDeleteEntry } from './wardQueueDeleteEntry';
import type { wardQueueGetEntry } from './wardQueueGetEntry';
import type { wardQueueSetEntry } from './wardQueueSetEntry';
import type { wardSetEntry } from './wardSetEntry';

// WARD entry operations. The queue has its own calls, as it has its own wire messages: a write
// that applies now and a write the device merely holds are different operations with different
// results, and one method returning either would put that distinction beyond the caller's reach.
export const TrezorConnectWard = Type.Object({
    wardSetEntry: Type.Unsafe<typeof wardSetEntry>(),
    wardQueueSetEntry: Type.Unsafe<typeof wardQueueSetEntry>(),
    wardQueueGetEntry: Type.Unsafe<typeof wardQueueGetEntry>(),
    wardQueueDeleteEntry: Type.Unsafe<typeof wardQueueDeleteEntry>(),
});
export type TrezorConnectWard = Static<typeof TrezorConnectWard>;
