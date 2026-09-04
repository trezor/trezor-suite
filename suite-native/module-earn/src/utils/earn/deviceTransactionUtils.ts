import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import { getAccountIdentity, getMevProtectedTxData } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

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
    isMevProtectionEnabled: boolean;
};

export const pushYieldTransaction = ({
    tx,
    account,
    isMevProtectionEnabled,
}: PushYieldTransactionParams) =>
    TrezorConnect.pushTransaction({
        tx: getMevProtectedTxData(account.symbol, tx, isMevProtectionEnabled),
        coin: asCoinSymbol(account.symbol),
        identity: getAccountIdentity(account),
    });
