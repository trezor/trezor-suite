import produce from 'immer';
import { RECEIVE } from '@wallet-actions/constants';
import { Action as SuiteAction } from '@suite-types';

export interface ReceiveInfo {
    descriptor: string;
    isAddressVerified: boolean;
    isAddressUnverified: boolean;
    isAddressVerifying: boolean;
}

export interface State {
    addresses: ReceiveInfo[];
}

export const initialState: State = {
    addresses: [],
};

const initAddress = (draft: State, descriptor: string) => {
    const receiveInfo = draft.addresses.find(r => r.descriptor === descriptor);
    if (!receiveInfo) {
        draft.addresses.push({
            descriptor,
            isAddressVerified: false,
            isAddressUnverified: false,
            isAddressVerifying: true,
        });
    } else {
        receiveInfo.isAddressVerifying = true;
    }
};

const showAddress = (draft: State, descriptor: string) => {
    const receiveInfo = draft.addresses.find(r => r.descriptor === descriptor);
    if (receiveInfo) {
        receiveInfo.isAddressVerified = true;
        receiveInfo.isAddressUnverified = false;
        receiveInfo.isAddressVerifying = false;
    } else {
        draft.addresses.push({
            descriptor,
            isAddressVerified: true,
            isAddressUnverified: false,
            isAddressVerifying: false,
        });
    }
};

const showUnverifiedAddress = (draft: State, descriptor: string) => {
    const receiveInfo = draft.addresses.find(r => r.descriptor === descriptor);
    if (receiveInfo) {
        receiveInfo.isAddressVerified = false;
        receiveInfo.isAddressUnverified = true;
        receiveInfo.isAddressVerifying = false;
    } else {
        draft.addresses.push({
            descriptor,
            isAddressVerified: false,
            isAddressUnverified: true,
            isAddressVerifying: false,
        });
    }
};

const hideAddress = (draft: State, descriptor: string) => {
    const receiveInfoIndex = draft.addresses.findIndex(r => r.descriptor === descriptor);
    if (receiveInfoIndex) {
        draft.addresses.splice(receiveInfoIndex, 1);
    }
};

export default (state: State = initialState, action: SuiteAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case RECEIVE.INIT:
                initAddress(draft, action.descriptor);
                break;

            case RECEIVE.DISPOSE:
                return initialState;

            case RECEIVE.SHOW_ADDRESS:
                showAddress(draft, action.descriptor);
                break;

            case RECEIVE.HIDE_ADDRESS:
                hideAddress(draft, action.descriptor);
                break;

            case RECEIVE.SHOW_UNVERIFIED_ADDRESS:
                showUnverifiedAddress(draft, action.descriptor);
                break;

            // no default
        }
    });
};
