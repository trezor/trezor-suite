import type { moneroGetAddress } from './moneroGetAddress';
import type { moneroGetWatchKey } from './moneroGetWatchKey';
import type { moneroKeyImageSync } from './moneroKeyImageSync';
import type { moneroSignTransaction } from './moneroSignTransaction';

// Monero-specific operations
export interface TrezorConnectMonero {
    moneroGetAddress: typeof moneroGetAddress;
    moneroGetWatchKey: typeof moneroGetWatchKey;
    moneroKeyImageSync: typeof moneroKeyImageSync;
    moneroSignTransaction: typeof moneroSignTransaction;
}
