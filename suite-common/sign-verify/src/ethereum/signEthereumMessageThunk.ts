import { type Account } from '@suite-common/wallet-types';

import { signEthereumMessage } from './signEthereumMessage';
import { signMessageThunk } from '../signMessageThunk';

type SignEthereumMessageThunkParams = {
    account: Account;
    message: string;
    hex: boolean;
};

/** An Ethereum account has a single address, so it always signs with the account's own path. */
export const signEthereumMessageThunk = ({
    account,
    message,
    hex,
}: SignEthereumMessageThunkParams) =>
    signMessageThunk({
        account,
        hex,
        signMessage: device => signEthereumMessage({ device, path: account.path, message, hex }),
    });
