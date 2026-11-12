import { type Account } from '@suite-common/wallet-types';

import { verifyBitcoinMessageThunk } from './bitcoin/verifyBitcoinMessageThunk';
import { verifyEthereumMessageThunk } from './ethereum/verifyEthereumMessageThunk';
import { verifyMessageThunk } from './verifyMessageThunk';

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
