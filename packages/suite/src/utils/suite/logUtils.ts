import { Action } from '@suite-types';
import { Account } from '@wallet-types';
import { ACCOUNT, TRANSACTION } from '@wallet-actions/constants';
import { SUITE } from '@suite-actions/constants';
import { DEVICE, AccountTransaction, Device } from 'trezor-connect';
import { DeepPartial } from '@suite/types/utils';
import { CustomLogEntry } from '@suite/reducers/suite/logReducer';

export const REDACTED_REPLACEMENT = '[redacted]';

export const redactAccount = (account: DeepPartial<Account> | undefined) => {
    if (!account) return undefined;
    return {
        ...account,
        descriptor: REDACTED_REPLACEMENT,
        addresses: REDACTED_REPLACEMENT,
        balance: REDACTED_REPLACEMENT,
        availableBalance: REDACTED_REPLACEMENT,
        formattedBalance: REDACTED_REPLACEMENT,
        history: {
            ...account?.history,
            transactions: REDACTED_REPLACEMENT,
        },
        tokens: account?.tokens?.map(t => ({
            ...t,
            balance: REDACTED_REPLACEMENT,
        })),
    };
};

export const redactDevice = (device: DeepPartial<Device> | undefined) => {
    if (!device) return undefined;
    return {
        ...device,
        id: REDACTED_REPLACEMENT,
        label: device.label ? REDACTED_REPLACEMENT : undefined,
        features: device.features
            ? {
                  ...device.features,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  device_id: REDACTED_REPLACEMENT,
              }
            : undefined,
    };
};

export const redactTransaction = (transaction: AccountTransaction) => ({
    ...transaction,
    amount: REDACTED_REPLACEMENT,
    txid: REDACTED_REPLACEMENT,
    targets: transaction.targets.map(t => ({
        ...t,
        amount: REDACTED_REPLACEMENT,
        addresses: t.addresses?.map(() => REDACTED_REPLACEMENT),
    })),
    details: undefined,
});

export const redactAction = (action: Action) => {
    let payload;
    switch (action.type) {
        case SUITE.UPDATE_SELECTED_DEVICE:
            payload = redactDevice(action.payload);
            break;
        case ACCOUNT.CREATE:
        case ACCOUNT.UPDATE:
            payload = redactAccount(action.payload);
            break;
        case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
            payload = {
                ...action.payload,
                account: action.payload?.account
                    ? redactAccount(action.payload.account)
                    : undefined,
            };
            break;
        default:
            return action;
    }
    return {
        ...action,
        payload,
    };
};

export const redactCustom = (action: CustomLogEntry['action']) => {
    let payload;
    switch (action.type) {
        case DEVICE.CONNECT:
        case DEVICE.DISCONNECT:
            payload = redactDevice(action.payload);
            break;
        case SUITE.UPDATE_SELECTED_DEVICE:
            payload = redactDevice(action.payload);
            break;
        case TRANSACTION.ADD:
            payload = {
                account: redactAccount(action.payload?.account),
                transactions: action.payload?.transactions?.map((t: AccountTransaction) =>
                    redactTransaction(t),
                ),
            };
            return {
                ...action,
                payload,
            };
        case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
            payload = {
                ...action.payload,
                account: action.payload?.account
                    ? redactAccount(action.payload.account)
                    : undefined,
            };
            break;

        default:
            return action;
    }
    return {
        ...action,
        payload,
    };
};
