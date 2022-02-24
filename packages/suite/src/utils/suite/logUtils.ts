import { Action } from '@suite-types';
import { Account, Discovery } from '@wallet-types';
import { ACCOUNT, DISCOVERY, TRANSACTION } from '@wallet-actions/constants';
import { SUITE } from '@suite-actions/constants';
import { DEVICE, Device } from 'trezor-connect';
import { DeepPartial } from '@suite/types/utils';
import { CustomLogEntry } from '@suite/reducers/suite/logReducer';

export const REDACTED_REPLACEMENT = '[redacted]';

export const prettifyLog = (json: Record<any, any>) => JSON.stringify(json, null, 2);

export const redactAccount = (account: DeepPartial<Account> | undefined) => {
    if (!account) return undefined;
    return {
        ...account,
        descriptor: REDACTED_REPLACEMENT,
        deviceState: REDACTED_REPLACEMENT,
        addresses: REDACTED_REPLACEMENT,
        balance: REDACTED_REPLACEMENT,
        availableBalance: REDACTED_REPLACEMENT,
        formattedBalance: REDACTED_REPLACEMENT,
        history: REDACTED_REPLACEMENT,
        tokens: account?.tokens?.map(t => ({
            ...t,
            balance: REDACTED_REPLACEMENT,
        })),
        utxo: REDACTED_REPLACEMENT,
        metadata: REDACTED_REPLACEMENT,
        key: REDACTED_REPLACEMENT,
    };
};

export const redactDiscovery = (discovery: DeepPartial<Discovery> | undefined) => {
    if (!discovery) return undefined;
    return {
        ...discovery,
        deviceState: REDACTED_REPLACEMENT,
    };
};

export const redactDevice = (device: DeepPartial<Device> | undefined) => {
    if (!device) return undefined;
    return {
        ...device,
        id: REDACTED_REPLACEMENT,
        label: device.label ? REDACTED_REPLACEMENT : undefined,
        state: REDACTED_REPLACEMENT,
        firmwareRelease: REDACTED_REPLACEMENT,
        features: device.features
            ? {
                  ...device.features,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  device_id: REDACTED_REPLACEMENT,
                  label: device.features.label ? REDACTED_REPLACEMENT : undefined,
              }
            : undefined,
    };
};

export const redactAction = (action: Action): Action => {
    let payload: any;
    switch (action.type) {
        case DEVICE.CONNECT:
        case DEVICE.DISCONNECT:
            payload = redactDevice(action.payload);
            break;

        case ACCOUNT.CREATE:
        case ACCOUNT.UPDATE:
            payload = redactAccount(action.payload);
            break;
        case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
            payload = {
                ...action.payload,
                account: redactAccount(action.payload.account),
            };
            break;
        case DISCOVERY.COMPLETE:
            payload = redactDiscovery(action.payload);
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
        case SUITE.AUTH_DEVICE:
            payload = {
                state: REDACTED_REPLACEMENT,
                payload: redactDevice(action.payload),
            };
            break;
        case TRANSACTION.ADD:
            payload = {
                ...action.payload,
                deviceState: REDACTED_REPLACEMENT,
                descriptor: REDACTED_REPLACEMENT,
            };
            break;
        case ACCOUNT.UPDATE_SELECTED_ACCOUNT:
            payload = {
                ...action.payload,
                account: redactAccount(action.payload?.account),
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
