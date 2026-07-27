import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { cardanoComposeTransaction } from './cardanoComposeTransaction';
import type { cardanoGetAddress } from './cardanoGetAddress';
import type { cardanoGetNativeScriptHash } from './cardanoGetNativeScriptHash';
import type { cardanoGetPublicKey } from './cardanoGetPublicKey';
import type { cardanoSignMessage } from './cardanoSignMessage';
import type { cardanoSignTransaction } from './cardanoSignTransaction';

// Cardano-specific operations
export const TrezorConnectCardano = Type.Object({
    cardanoGetAddress: Type.Unsafe<typeof cardanoGetAddress>(),
    cardanoGetPublicKey: Type.Unsafe<typeof cardanoGetPublicKey>(),
    cardanoGetNativeScriptHash: Type.Unsafe<typeof cardanoGetNativeScriptHash>(),
    cardanoSignTransaction: Type.Unsafe<typeof cardanoSignTransaction>(),
    cardanoSignMessage: Type.Unsafe<typeof cardanoSignMessage>(),
    cardanoComposeTransaction: Type.Unsafe<typeof cardanoComposeTransaction>(),
});
export type TrezorConnectCardano = Static<typeof TrezorConnectCardano>;
