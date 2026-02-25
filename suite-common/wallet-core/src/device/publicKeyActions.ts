import { TrezorDevice } from '@suite-common/suite-types';
import { Account } from '@suite-common/wallet-types';
import { getDerivationType } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { SerializedError } from '@trezor/connect-common/src/constants/errors';
import { Result } from '@trezor/type-utils';

export const showXpubOnDevice = async (device: TrezorDevice, account: Account) => {
    const params = {
        device,
        path: account.path,
        showOnTrezor: true,
        derivationType: getDerivationType(account.accountType),
        coin: account.symbol,
    };

    let response: Result<unknown, SerializedError>;
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
                error: {
                    message: 'Method for getPublicKey not defined',
                    code: 'Failure_UnknownCode',
                },
            };
    }

    return response;
};
