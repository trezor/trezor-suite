import type { cardanoComposeTransaction } from './cardanoComposeTransaction';
import type { cardanoGetAddress } from './cardanoGetAddress';
import type { cardanoGetNativeScriptHash } from './cardanoGetNativeScriptHash';
import type { cardanoGetPublicKey } from './cardanoGetPublicKey';
import type { cardanoSignMessage } from './cardanoSignMessage';
import type { cardanoSignTransaction } from './cardanoSignTransaction';

// Cardano-specific operations
export interface TrezorConnectCardano {
    cardanoGetAddress: typeof cardanoGetAddress;
    cardanoGetPublicKey: typeof cardanoGetPublicKey;
    cardanoGetNativeScriptHash: typeof cardanoGetNativeScriptHash;
    cardanoSignTransaction: typeof cardanoSignTransaction;
    cardanoSignMessage: typeof cardanoSignMessage;
    cardanoComposeTransaction: typeof cardanoComposeTransaction;
}
