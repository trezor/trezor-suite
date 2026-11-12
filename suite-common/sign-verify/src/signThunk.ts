import { type Account } from '@suite-common/wallet-types';

import { signBitcoinMessageThunk } from './bitcoin/signBitcoinMessageThunk';
import { signCardanoMessageThunk } from './cardano/signCardanoMessageThunk';
import { signEthereumMessageThunk } from './ethereum/signEthereumMessageThunk';
import { signMessageThunk } from './signMessageThunk';

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
