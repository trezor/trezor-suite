import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { tezosGetAddress } from './tezosGetAddress';
import type { tezosGetPublicKey } from './tezosGetPublicKey';
import type { tezosSignTransaction } from './tezosSignTransaction';

// Tezos-specific operations
export const TrezorConnectTezos = Type.Object({
    tezosGetAddress: Type.Unsafe<typeof tezosGetAddress>(),
    tezosGetPublicKey: Type.Unsafe<typeof tezosGetPublicKey>(),
    tezosSignTransaction: Type.Unsafe<typeof tezosSignTransaction>(),
});
export type TrezorConnectTezos = Static<typeof TrezorConnectTezos>;
