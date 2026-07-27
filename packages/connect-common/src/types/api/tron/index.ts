import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { tronComposeTransaction } from './tronComposeTransaction';
import type { tronGetAddress } from './tronGetAddress';
import type { tronSignTransaction } from './tronSignTransaction';

// Tron-specific operations
export const TrezorConnectTron = Type.Object({
    tronGetAddress: Type.Unsafe<typeof tronGetAddress>(),
    tronSignTransaction: Type.Unsafe<typeof tronSignTransaction>(),
    tronComposeTransaction: Type.Unsafe<typeof tronComposeTransaction>(),
});
export type TrezorConnectTron = Static<typeof TrezorConnectTron>;
