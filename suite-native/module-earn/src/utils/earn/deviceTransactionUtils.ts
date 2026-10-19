import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type TrezorDevice } from '@suite-common/suite-types';
import { isEarnSigningCancelled } from '@suite-common/wallet-core';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';
import { getAccountIdentity, getMevProtectedTxData } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

type SignYieldTransactionOnDeviceParams = {
    analytics: AnalyticsDep['analytics'];
    networkSymbol: string;
    device: TrezorDevice;
    path: string;
    transaction: Parameters<typeof TrezorConnect.ethereumSignTransaction>[0]['transaction'];
    addressDisplayType: AddressDisplayOptions;
};

/** Device-signing ceremony shared by the earn thunks (yield actions, claim, wrap/unwrap). */
export const signYieldTransactionOnDevice = async ({
    analytics,
    networkSymbol,
    device,
    path,
    transaction,
    addressDisplayType,
}: SignYieldTransactionOnDeviceParams) => {
    const response = await TrezorConnect.ethereumSignTransaction({
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
    if (!response.success && isEarnSigningCancelled(response.error)) {
        analytics.report({
            type: events.transactionCancelEvent.name,
            payload: { txType: 'yield', networkSymbol, stage: 'signing' },
        });
    }

    return response;
};

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
