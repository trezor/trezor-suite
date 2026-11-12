import { type Account } from '@suite-common/wallet-types';

import { verifyBitcoinMessage } from './verifyBitcoinMessage';
import { verifyMessageThunk } from '../verifyMessageThunk';

type VerifyBitcoinMessageThunkParams = {
    account: Account;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export const verifyBitcoinMessageThunk = (params: VerifyBitcoinMessageThunkParams) =>
    verifyMessageThunk({
        account: params.account,
        hex: params.hex,
        verifyMessage: device => verifyBitcoinMessage({ ...params, device }),
    });
