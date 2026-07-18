import type { ethereumGetAddress } from './ethereumGetAddress';
import type { ethereumGetPublicKey } from './ethereumGetPublicKey';
import type { ethereumSignMessage } from './ethereumSignMessage';
import type { ethereumSignTransaction } from './ethereumSignTransaction';
import type { ethereumSignTypedData } from './ethereumSignTypedData';
import type { ethereumVerifyMessage } from './ethereumVerifyMessage';

// Ethereum-specific operations
export interface TrezorConnectEthereum {
    ethereumGetAddress: typeof ethereumGetAddress;
    ethereumGetPublicKey: typeof ethereumGetPublicKey;
    ethereumSignTransaction: typeof ethereumSignTransaction;
    ethereumSignMessage: typeof ethereumSignMessage;
    ethereumSignTypedData: typeof ethereumSignTypedData;
    ethereumVerifyMessage: typeof ethereumVerifyMessage;
}
