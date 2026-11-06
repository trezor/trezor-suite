import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { wardCacheEntry } from './wardCacheEntry';
import type { wardDisplayAddress } from './wardDisplayAddress';
import type { wardInit } from './wardInit';
import type { wardListPending } from './wardListPending';
import type { wardLookup } from './wardLookup';
import type { wardSetRoot } from './wardSetRoot';
import type { wardUpdate } from './wardUpdate';
import type { wardVerify } from './wardVerify';

// WARD: the device-authenticated label database. The methods relay the device to wardd.
export const TrezorConnectWard = Type.Object({
    wardInit: Type.Unsafe<typeof wardInit>(),
    wardListPending: Type.Unsafe<typeof wardListPending>(),
    wardSetRoot: Type.Unsafe<typeof wardSetRoot>(),
    wardLookup: Type.Unsafe<typeof wardLookup>(),
    wardUpdate: Type.Unsafe<typeof wardUpdate>(),
    wardVerify: Type.Unsafe<typeof wardVerify>(),
    wardDisplayAddress: Type.Unsafe<typeof wardDisplayAddress>(),
    wardCacheEntry: Type.Unsafe<typeof wardCacheEntry>(),
});
export type TrezorConnectWard = Static<typeof TrezorConnectWard>;
