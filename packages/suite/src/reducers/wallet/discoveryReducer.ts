import produce from 'immer';
import { DISCOVERY } from 'src/actions/wallet/constants';
import { STORAGE } from 'src/actions/suite/constants';
import { createDeferred } from '@trezor/utils';
import type { AppState, Action as SuiteAction } from 'src/types/suite';
import type { WalletAction } from 'src/types/wallet';
import type { Discovery as CommonDiscovery } from '@suite-common/wallet-types';

export type Discovery = CommonDiscovery;

export type PartialDiscovery = { deviceState: string } & Partial<Discovery>;

type State = Discovery[];
const initialState: State = [];

const create = (draft: State, discovery: Discovery) => {
    const index = draft.findIndex(d => d.deviceState === discovery.deviceState);
    if (index < 0) {
        draft.push(discovery);
    }
};

const start = (draft: State, payload: PartialDiscovery) => {
    const index = draft.findIndex(f => f.deviceState === payload.deviceState);
    if (index >= 0) {
        draft[index] = {
            ...draft[index],
            ...payload,
            running: createDeferred(),
        };
    }
};

const update = (draft: State, payload: PartialDiscovery, resolve?: boolean) => {
    const index = draft.findIndex(f => f.deviceState === payload.deviceState);
    if (index >= 0) {
        const dfd = draft[index].running;
        draft[index] = {
            ...draft[index],
            ...payload,
        };
        if (resolve && dfd) {
            dfd.resolve();
            delete draft[index].running;
        }
        if (!payload.error) {
            delete draft[index].error;
        }
    }
};

const remove = (draft: State, payload: PartialDiscovery) => {
    const index = draft.findIndex(f => f.deviceState === payload.deviceState);
    draft.splice(index, 1);
};

const discoveryReducer = (state: State = initialState, action: WalletAction | SuiteAction): State =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                return action.payload.discovery;
            case DISCOVERY.CREATE:
                create(draft, action.payload);
                break;
            case DISCOVERY.START:
                start(draft, action.payload);
                break;
            case DISCOVERY.UPDATE:
            case DISCOVERY.INTERRUPT:
                update(draft, action.payload);
                break;
            case DISCOVERY.STOP:
            case DISCOVERY.COMPLETE:
                update(draft, action.payload, true);
                break;
            case DISCOVERY.REMOVE:
                remove(draft, action.payload);
                break;
            // no default
        }
    });

export default discoveryReducer;

type RootState = Pick<AppState, 'wallet' | 'suite'>;

// Get discovery process for deviceState.
export const selectDiscovery = (state: RootState, deviceState: string | undefined) =>
    deviceState ? state.wallet.discovery.find(d => d.deviceState === deviceState) : undefined;

export const selectDiscoveryForDevice = (state: RootState) =>
    selectDiscovery(state, state.suite.device?.state);

/**
 * Helper selector called from components
 * return `true` if discovery process is running/completed and `authConfirm` is required
 */
export const selectIsDiscoveryAuthConfirmationRequired = (state: RootState) => {
    const discovery = selectDiscoveryForDevice(state);

    return (
        discovery &&
        discovery.authConfirm &&
        (discovery.status < DISCOVERY.STATUS.STOPPING ||
            discovery.status === DISCOVERY.STATUS.COMPLETED)
    );
};
