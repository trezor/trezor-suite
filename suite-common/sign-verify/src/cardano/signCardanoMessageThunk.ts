import { type Account } from '@suite-common/wallet-types';

import { signCardanoMessage } from './signCardanoMessage';
import { signMessageThunk } from '../signMessageThunk';

type SignCardanoMessageThunkParams = {
    account: Account;
    path: string;
    message: string;
    hex: boolean;
    /** Returns the public key as a COSE key instead of a raw one. */
    isCose: boolean;
};

export const signCardanoMessageThunk = (params: SignCardanoMessageThunkParams) =>
    signMessageThunk({
        account: params.account,
        hex: params.hex,
        signMessage: device => signCardanoMessage({ ...params, device }),
    });
