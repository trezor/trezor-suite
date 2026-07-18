import type { discoverAccounts } from './discoverAccounts';
import type { getAccountInfo } from './getAccountInfo';
import type { getAddress } from './getAddress';
import type { getCoinInfo } from './getCoinInfo';
import type { getPublicKey } from './getPublicKey';
import type { signMessage } from './signMessage';
import type { verifyMessage } from './verifyMessage';
import type { selectAccount } from '../selectAccount';

// Generic account and address operations (multi-coin)
export interface TrezorConnectAccount {
    getAddress: typeof getAddress;
    getPublicKey: typeof getPublicKey;
    getAccountInfo: typeof getAccountInfo;
    discoverAccounts: typeof discoverAccounts;
    selectAccount: typeof selectAccount;
    signMessage: typeof signMessage;
    verifyMessage: typeof verifyMessage;
    getCoinInfo: typeof getCoinInfo;
}
