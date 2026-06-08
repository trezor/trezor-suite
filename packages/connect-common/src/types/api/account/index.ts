import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { discoverAccounts } from './discoverAccounts';
import type { getAccountInfo } from './getAccountInfo';
import type { getAddress } from './getAddress';
import type { getCoinInfo } from './getCoinInfo';
import type { getPublicKey } from './getPublicKey';
import type { signMessage } from './signMessage';
import type { verifyMessage } from './verifyMessage';
import type { selectAccount } from '../selectAccount';

// Generic account and address operations (multi-coin)
export const TrezorConnectAccount = Type.Object({
    getAddress: Type.Unsafe<typeof getAddress>(),
    getPublicKey: Type.Unsafe<typeof getPublicKey>(),
    getAccountInfo: Type.Unsafe<typeof getAccountInfo>(),
    discoverAccounts: Type.Unsafe<typeof discoverAccounts>(),
    selectAccount: Type.Unsafe<typeof selectAccount>(),
    signMessage: Type.Unsafe<typeof signMessage>(),
    verifyMessage: Type.Unsafe<typeof verifyMessage>(),
    getCoinInfo: Type.Unsafe<typeof getCoinInfo>(),
});
export type TrezorConnectAccount = Static<typeof TrezorConnectAccount>;
