import type { authorizeCoinjoin } from './authorizeCoinjoin';
import type { cancelCoinjoinAuthorization } from './cancelCoinjoinAuthorization';
import type { composePsbt } from './composePsbt';
import type { composeTransaction } from './composeTransaction';
import type { sendTransaction } from './sendTransaction';
import type { signTransaction } from './signTransaction';

// Bitcoin-specific operations
export type TrezorConnectBitcoin = {
    signTransaction: typeof signTransaction;
    sendTransaction: typeof sendTransaction;
    composePsbt: typeof composePsbt;
    composeTransaction: typeof composeTransaction;
    authorizeCoinjoin: typeof authorizeCoinjoin;
    cancelCoinjoinAuthorization: typeof cancelCoinjoinAuthorization;
};
