import { type Account } from '@suite-common/wallet-types';

import { verifyEthereumMessage } from './verifyEthereumMessage';
import { verifyMessageThunk } from '../verifyMessageThunk';

type VerifyEthereumMessageThunkParams = {
    account: Account;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export const verifyEthereumMessageThunk = ({
    account,
    ...params
}: VerifyEthereumMessageThunkParams) =>
    verifyMessageThunk({
        account,
        hex: params.hex,
        verifyMessage: device => verifyEthereumMessage({ ...params, device }),
    });
