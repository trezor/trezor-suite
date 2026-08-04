import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { ethereumGetAddress } from './ethereumGetAddress';
import type { ethereumGetPublicKey } from './ethereumGetPublicKey';
import type { ethereumSignAuth7702 } from './ethereumSignAuth7702';
import type { ethereumSignMessage } from './ethereumSignMessage';
import type { ethereumSignTransaction } from './ethereumSignTransaction';
import type { ethereumSignTypedData } from './ethereumSignTypedData';
import type { ethereumVerifyMessage } from './ethereumVerifyMessage';

// Ethereum-specific operations
export const TrezorConnectEthereum = Type.Object({
    ethereumGetAddress: Type.Unsafe<typeof ethereumGetAddress>(),
    ethereumGetPublicKey: Type.Unsafe<typeof ethereumGetPublicKey>(),
    ethereumSignTransaction: Type.Unsafe<typeof ethereumSignTransaction>(),
    ethereumSignMessage: Type.Unsafe<typeof ethereumSignMessage>(),
    ethereumSignTypedData: Type.Unsafe<typeof ethereumSignTypedData>(),
    ethereumSignAuth7702: Type.Unsafe<typeof ethereumSignAuth7702>(),
    ethereumVerifyMessage: Type.Unsafe<typeof ethereumVerifyMessage>(),
});
export type TrezorConnectEthereum = Static<typeof TrezorConnectEthereum>;
