import type { tezosGetAddress } from './tezosGetAddress';
import type { tezosGetPublicKey } from './tezosGetPublicKey';
import type { tezosSignTransaction } from './tezosSignTransaction';

// Tezos-specific operations
export interface TrezorConnectTezos {
    tezosGetAddress: typeof tezosGetAddress;
    tezosGetPublicKey: typeof tezosGetPublicKey;
    tezosSignTransaction: typeof tezosSignTransaction;
}
