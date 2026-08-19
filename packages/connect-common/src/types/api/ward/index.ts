import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { wardSetEntry } from './wardSetEntry';

// WARD entry operations
export const TrezorConnectWard = Type.Object({
    wardSetEntry: Type.Unsafe<typeof wardSetEntry>(),
});
export type TrezorConnectWard = Static<typeof TrezorConnectWard>;
