import { TrezorDevice } from '@suite-common/suite-types';
import { Account } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import {
    getAddressType,
    getStakingPath,
    getProtocolMagic,
    getNetworkId,
    getDerivationType,
} from './cardanoUtils';

export const readAddressFromDevice = async ({
    device,
    account,
    addressPath,
}: {
    device: TrezorDevice;
    account: Account;
    addressPath: string;
}) => {
    let response;
    const params = {
        device,
        path: addressPath,
        unlockPath: account.unlockPath,
        useEmptyPassphrase: device.useEmptyPassphrase,
        coin: account.symbol,
    };

    switch (account.networkType) {
        case 'ethereum':
            response = await TrezorConnect.ethereumGetAddress(params);
            break;
        case 'cardano':
            response = await TrezorConnect.cardanoGetAddress({
                device,
                useEmptyPassphrase: device.useEmptyPassphrase,
                addressParameters: {
                    stakingPath: getStakingPath(account),
                    addressType: getAddressType(account.accountType),
                    path,
                },
                protocolMagic: getProtocolMagic(account.symbol),
                networkId: getNetworkId(account.symbol),
                derivationType: getDerivationType(account.accountType),
            });
            break;
        case 'ripple':
            response = await TrezorConnect.rippleGetAddress(params);
            break;
        case 'bitcoin':
            response = await TrezorConnect.getAddress(params);
            break;
        default:
            response = {
                success: false,
                payload: { error: 'Method for getAddress not defined', code: undefined },
            };
            break;
    }

    return response;
};
