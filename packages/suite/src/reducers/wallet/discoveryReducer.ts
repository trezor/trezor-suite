import produce from 'immer';
import { DISCOVERY } from '@wallet-actions/constants';
import { STORAGE } from '@suite-actions/constants';
import { Deferred, createDeferred } from '@suite-utils/deferred';
import { ObjectValues } from '@suite/types/utils';
import { Action as SuiteAction } from '@suite-types';
import { WalletAction } from '@wallet-types';

export const DISCOVERY_STATUS = {
    IDLE: 0,
    RUNNING: 1,
    STOPPING: 2,
    STOPPED: 3,
    COMPLETED: 4,
} as const;

export interface Discovery {
    deviceState: string;
    index: number;
    total: number;
    loaded: number;
    bundleSize: number;
    status: ObjectValues<typeof DISCOVERY_STATUS>;
    // coins which failed to load
    failed: {
        symbol: string;
        index: number;
        accountType: string;
        error: string;
        fwException?: string;
    }[];
    networks: string[];
    running?: Deferred<void>;
}

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
        }
    }
};

const remove = (draft: State, payload: PartialDiscovery) => {
    const index = draft.findIndex(f => f.deviceState === payload.deviceState);
    draft.splice(index, 1);
};

export default (state: State = initialState, action: WalletAction | SuiteAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOADED:
                return action.payload.wallet.discovery;
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
};
