import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { solanaComposeTransaction } from './solanaComposeTransaction';
import type { solanaGetAddress } from './solanaGetAddress';
import type { solanaGetPublicKey } from './solanaGetPublicKey';
import type { solanaSignMessage } from './solanaSignMessage';
import type { solanaSignTransaction } from './solanaSignTransaction';

// Solana-specific operations
export const TrezorConnectSolana = Type.Object({
    solanaGetAddress: Type.Unsafe<typeof solanaGetAddress>(),
    solanaGetPublicKey: Type.Unsafe<typeof solanaGetPublicKey>(),
    solanaSignTransaction: Type.Unsafe<typeof solanaSignTransaction>(),
    solanaSignMessage: Type.Unsafe<typeof solanaSignMessage>(),
    solanaComposeTransaction: Type.Unsafe<typeof solanaComposeTransaction>(),
});
export type TrezorConnectSolana = Static<typeof TrezorConnectSolana>;
