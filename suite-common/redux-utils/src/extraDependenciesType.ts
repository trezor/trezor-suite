/* eslint-disable @typescript-eslint/ban-types */
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account, FeeInfo } from '@suite-common/wallet-types';
import { TrezorDevice } from '@suite-common/suite-types';
import { PROTO } from '@trezor/connect';
import { NotificationEventPayload } from '@suite-common/notifications';

import { ActionType, SuiteCompatibleSelector, SuiteCompatibleThunk } from './types';

type StorageLoadReducer = (state: any, action: { type: any; payload: any }) => void;

export type ExtraDependencies = {
    thunks: {
        fetchAndUpdateAccount: SuiteCompatibleThunk<Account>;
        notificationsAddEvent: SuiteCompatibleThunk<NotificationEventPayload>;
    };
    selectors: {
        selectFeeInfo: (networkSymbol: NetworkSymbol) => SuiteCompatibleSelector<FeeInfo>;
        selectAccounts: SuiteCompatibleSelector<Account[]>;
        selectDevices: SuiteCompatibleSelector<TrezorDevice[]>;
        selectBitcoinAmountUnit: SuiteCompatibleSelector<PROTO.AmountUnit>;
    };
    // You should only use ActionCreatorWithPayload from redux-toolkit!
    // That means you will need to convert actual action creators in packages/suite to use createAction from redux-toolkit,
    // but that shouldn't be problem.
    actions: {};
    // Use action types + reducers as last resort if you can't use actions creators. For example for storageLoad it is used because
    // it would be really hard to move all types to @suite-common that are needed to type payload. This comes at cost of
    // having "any" type for action.payload in reducer. We can overcome this issue if we define reducers of storageLoad
    // in place where we have all types available to ensure type safety.
    actionTypes: { storageLoad: ActionType };
    reducers: {
        storageLoadBlockchain: StorageLoadReducer;
    };
};
