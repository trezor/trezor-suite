import { type Account } from '@suite-common/wallet-types';

import { signBitcoinMessageThunk, verifyBitcoinMessageThunk } from './bitcoin/bitcoinSignVerify';
import { signCardanoMessageThunk } from './cardano/cardanoSignVerify';
import {
    signEthereumMessageThunk,
    verifyEthereumMessageThunk,
} from './ethereum/ethereumSignVerify';
import { signMessageThunk, verifyMessageThunk } from './signVerifyActions';

/**
 * @deprecated Decide in the network's own module instead. Kept until the forms that still branch on
 * the network move to network modules.
 */
export const isVerifySupported = (account?: Account) =>
    account?.networkType === 'bitcoin' || account?.networkType === 'ethereum';

/**
 * @deprecated Dispatch the network's own thunk instead. Kept until the forms that still branch on
 * the network move to network modules.
 */
export const signThunk = (
    account: Account,
    path: string,
    message: string,
    hex = false,
    isElectrum = false,
    isCose = false,
) => {
    switch (account.networkType) {
        case 'bitcoin':
            return signBitcoinMessageThunk({ account, path, message, hex, isElectrum });
        case 'ethereum':
            return signEthereumMessageThunk({ account, message, hex });
        case 'cardano':
            return signCardanoMessageThunk({ account, path, message, hex, isCose });
        default:
            return signMessageThunk({
                account,
                hex,
                signMessage: () => Promise.reject(new Error('Signing not supported')),
            });
    }
};

/**
 * @deprecated Dispatch the network's own thunk instead. Kept until the forms that still branch on
 * the network move to network modules.
 */
export const verifyThunk = (
    account: Account,
    address: string,
    message: string,
    signature: string,
    hex = false,
) => {
    const params = { account, address, message, signature, hex };

    switch (account.networkType) {
        case 'bitcoin':
            return verifyBitcoinMessageThunk(params);
        case 'ethereum':
            return verifyEthereumMessageThunk(params);
        default:
            return verifyMessageThunk({
                account,
                hex,
                verifyMessage: () => Promise.reject(new Error('Verifying not supported')),
            });
    }
};
