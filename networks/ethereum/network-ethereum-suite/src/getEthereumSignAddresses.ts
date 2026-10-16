import { type Account } from '@suite-common/wallet-types';
import { type SignAddresses } from '@trezor/network-module-suite-sign-verify';

/** Ethereum signs with the account address alone, so there is nothing to choose between. */
export const getEthereumSignAddresses = (account: Account): SignAddresses => ({
    [account.path]: {
        path: account.path,
        address: account.descriptor,
        category: '',
    },
});
