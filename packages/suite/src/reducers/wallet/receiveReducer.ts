import { UI } from 'trezor-connect';
import produce from 'immer';
import { RECEIVE, ACCOUNT } from '@wallet-actions/constants';
// import { Action } from '@wallet-types/index';
import { Action as SuiteAction } from '@suite-types/index';

export interface ReceiveInfo {
    descriptor: string;
    isAddressVerified: boolean;
    isAddressUnverified: boolean;
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
        });
    }
};

const showAddress = (draft: State, descriptor: string) => {
    const receiveInfo = draft.addresses.find(r => r.descriptor === descriptor);
    if (receiveInfo) {
        receiveInfo.isAddressVerified = true;
        receiveInfo.isAddressUnverified = false;
    } else {
        draft.addresses.push({
            descriptor,
            isAddressVerified: true,
            isAddressUnverified: false,
        });
    }
};

const showUnverifiedAddress = (draft: State, descriptor: string) => {
    const receiveInfo = draft.addresses.find(r => r.descriptor === descriptor);
    if (receiveInfo) {
        receiveInfo.isAddressVerified = false;
        receiveInfo.isAddressUnverified = true;
    } else {
        draft.addresses.push({
            descriptor,
            isAddressVerified: false,
            isAddressUnverified: true,
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

            case ACCOUNT.DISPOSE:
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

            // @ts-ignore
            // need fix in connect?
            case UI.REQUEST_BUTTON:
                if (action.payload.code === 'ButtonRequest_Address') {
                    draft.isAddressVerified = true;
                }
            // no default
        }
    });
};
