import { type SignAddresses } from '@suite/sign-verify';
import { type Account } from '@suite-common/wallet-types';

/** Ethereum signs with the account address alone, so there is nothing to choose between. */
export const getEthereumSignAddresses = (account: Account): SignAddresses => ({
    [account.path]: {
        path: account.path,
        address: account.descriptor,
        category: '',
    },
});
