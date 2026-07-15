import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { authorizeCoinjoin } from './authorizeCoinjoin';
import type { cancelCoinjoinAuthorization } from './cancelCoinjoinAuthorization';
import type { composeTransaction } from './composeTransaction';
import type { signTransaction } from './signTransaction';

// Bitcoin-specific operations
export const TrezorConnectBitcoin = Type.Object({
    signTransaction: Type.Unsafe<typeof signTransaction>(),
    composeTransaction: Type.Unsafe<typeof composeTransaction>(),
    authorizeCoinjoin: Type.Unsafe<typeof authorizeCoinjoin>(),
    cancelCoinjoinAuthorization: Type.Unsafe<typeof cancelCoinjoinAuthorization>(),
});
export type TrezorConnectBitcoin = Static<typeof TrezorConnectBitcoin>;
