import { POLLING } from 'src/actions/wallet/constants';
import produce from 'immer';
import { Action } from 'src/types/suite';
import { Polling } from 'src/types/wallet/polling';

export interface PollingState {
    [key: string]: Polling;
}
export const initialState: PollingState = {};

const pollingReducer = (state: PollingState = initialState, action: Action): PollingState =>
    produce(state, draft => {
        switch (action.type) {
            case POLLING.START:
                if (!draft[action.key]) {
                    const { type, key, ...polling } = action;
                    draft[key] = {
                        ...polling,
                        counter: 0,
                    };
                }
                break;
            case POLLING.REQUEST: {
                const polling = draft[action.key];
                if (polling) {
                    polling.counter += 1;
                    polling.timeoutId = action.timeoutId;
                }
                break;
            }
            case POLLING.STOP: {
                delete draft[action.key];
                break;
            }
            // no default
        }
    });

export default pollingReducer;
