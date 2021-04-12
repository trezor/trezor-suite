import produce from 'immer';
import { RECEIVE } from '@wallet-actions/constants';
import { Action as SuiteAction } from '@suite-types';

export interface ReceiveInfo {
    path: string;
    address: string;
    isVerified: boolean;
}

export type State = ReceiveInfo[];

const showAddress = (draft: State, path: string, address: string) => {
    const receiveInfo = draft.find(r => r.address === address);
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

const showUnverifiedAddress = (draft: State, path: string, address: string) => {
    const receiveInfo = draft.find(r => r.address === address);
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

const receiveReducer = (state: State = [], action: SuiteAction): State =>
    produce(state, draft => {
        switch (action.type) {
            case RECEIVE.DISPOSE:
                return [];

            case RECEIVE.SHOW_ADDRESS:
                showAddress(draft, action.path, action.address);
                break;

            case RECEIVE.SHOW_UNVERIFIED_ADDRESS:
                showUnverifiedAddress(draft, action.path, action.address);
                break;

            // no default
        }
    });

export default receiveReducer;
