import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { authorizeCoinjoin } from './authorizeCoinjoin';
import type { cancelCoinjoinAuthorization } from './cancelCoinjoinAuthorization';
import type { composePsbt } from './composePsbt';
import type { composeTransaction } from './composeTransaction';
import type { sendTransaction } from './sendTransaction';
import type { signTransaction } from './signTransaction';

// Bitcoin-specific operations
export const TrezorConnectBitcoin = Type.Object({
    signTransaction: Type.Unsafe<typeof signTransaction>(),
    sendTransaction: Type.Unsafe<typeof sendTransaction>(),
    composePsbt: Type.Unsafe<typeof composePsbt>(),
    composeTransaction: Type.Unsafe<typeof composeTransaction>(),
    authorizeCoinjoin: Type.Unsafe<typeof authorizeCoinjoin>(),
    cancelCoinjoinAuthorization: Type.Unsafe<typeof cancelCoinjoinAuthorization>(),
});
export type TrezorConnectBitcoin = Static<typeof TrezorConnectBitcoin>;
