import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

type SignYieldTransactionOnDeviceParams = {
    device: TrezorDevice;
    path: string;
    transaction: Parameters<typeof TrezorConnect.ethereumSignTransaction>[0]['transaction'];
    addressDisplayType: AddressDisplayOptions;
};

/** Device-signing ceremony shared by the earn thunks (yield actions, claim, wrap/unwrap). */
export const signYieldTransactionOnDevice = ({
    device,
    path,
    transaction,
    addressDisplayType,
}: SignYieldTransactionOnDeviceParams) =>
    TrezorConnect.ethereumSignTransaction({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
            useEmptyPassphrase: device.useEmptyPassphrase,
        },
        path,
        transaction,
        chunkify: addressDisplayType === AddressDisplayOptions.CHUNKED,
    });

type PushYieldTransactionParams = {
    tx: string;
    account: Account;
};

export const pushYieldTransaction = ({ tx, account }: PushYieldTransactionParams) =>
    TrezorConnect.pushTransaction({
        tx,
        coin: account.symbol,
        identity: getAccountIdentity(account),
    });
