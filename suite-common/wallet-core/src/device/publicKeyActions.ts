import { TrezorDevice } from '@suite-common/suite-types';
import { Account } from '@suite-common/wallet-types';
import { getDerivationType } from '@suite-common/wallet-utils';
import TrezorConnect, { Success, Unsuccessful } from '@trezor/connect';

export const showXpubOnDevice = async (device: TrezorDevice, account: Account) => {
    const params = {
        device,
        path: account.path,
        showOnTrezor: true,
        derivationType: getDerivationType(account.accountType),
        coin: account.symbol,
    };

    let response: Success<unknown> | Unsuccessful;
    switch (account.networkType) {
        case 'bitcoin':
            response = await TrezorConnect.getPublicKey(params);
            break;
        case 'cardano':
            response = await TrezorConnect.cardanoGetPublicKey(params);
            break;
        case 'solana':
            response = await TrezorConnect.solanaGetPublicKey(params);
            break;
        default:
            response = {
                success: false,
                payload: { error: 'Method for getPublicKey not defined', code: undefined },
            };
    }

    return response;
};
