import type { authorizeCoinjoin } from './authorizeCoinjoin';
import type { cancelCoinjoinAuthorization } from './cancelCoinjoinAuthorization';
import type { composeTransaction } from './composeTransaction';
import type { signTransaction } from './signTransaction';

// Bitcoin-specific operations
export interface TrezorConnectBitcoin {
    signTransaction: typeof signTransaction;
    composeTransaction: typeof composeTransaction;
    authorizeCoinjoin: typeof authorizeCoinjoin;
    cancelCoinjoinAuthorization: typeof cancelCoinjoinAuthorization;
}
