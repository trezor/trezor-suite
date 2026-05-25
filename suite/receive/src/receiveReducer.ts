import { createAction } from '@reduxjs/toolkit';
import { produce } from 'immer';
import { type UnknownAction } from 'redux';

import { type ReceiveInfo } from '@suite-common/wallet-types';

const RECEIVE_DISPOSE = '@receive/dispose';
const RECEIVE_SHOW_ADDRESS = '@receive/show-address';
const RECEIVE_SHOW_UNVERIFIED_ADDRESS = '@receive/show-unverified-address';

export type State = ReceiveInfo[];

export const dispose = createAction(RECEIVE_DISPOSE);

export const showAddressAction = createAction(
    RECEIVE_SHOW_ADDRESS,
    (path: string, address: string) => ({ payload: { path, address } }),
);

export const showUnverifiedAddressAction = createAction(
    RECEIVE_SHOW_UNVERIFIED_ADDRESS,
    (path: string, address: string) => ({ payload: { path, address } }),
);

export type ReceiveAction =
    | ReturnType<typeof dispose>
    | ReturnType<typeof showAddressAction>
    | ReturnType<typeof showUnverifiedAddressAction>;

const markAddressVerified = (draft: State, path: string, address: string) => {
    const receiveInfo = draft.find(receive => receive.address === address);
    if (receiveInfo) {
        receiveInfo.isVerified = true;
    } else {
        draft.unshift({
            path,
            address,
            isVerified: true,
        });
    }
};

const markAddressUnverified = (draft: State, path: string, address: string) => {
    const receiveInfo = draft.find(receive => receive.address === address);
    if (receiveInfo) {
        receiveInfo.isVerified = false;
    } else {
        draft.unshift({
            path,
            address,
            isVerified: false,
        });
    }
};

export const receiveReducer = (state: State = [], action: UnknownAction): State =>
    produce(state, draft => {
        if (dispose.match(action)) {
            return [];
        }

        if (showAddressAction.match(action)) {
            markAddressVerified(draft, action.payload.path, action.payload.address);

            return;
        }

        if (showUnverifiedAddressAction.match(action)) {
            markAddressUnverified(draft, action.payload.path, action.payload.address);
        }
    });
