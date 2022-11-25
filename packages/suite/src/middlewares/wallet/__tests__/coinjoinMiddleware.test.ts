import { combineReducers, createReducer } from '@reduxjs/toolkit';
import { configureMockStore } from '@suite-common/test-utils';
import { coinjoinReducer } from '@wallet-reducers/coinjoinReducer';
import { coinjoinMiddleware } from '@wallet-middlewares/coinjoinMiddleware';
import { SESSION_PHASE_TRANSITION_DELAY } from '@suite-constants/coinjoin';
import { sessionPhaseFixture } from '@wallet-middlewares/__fixtures__/coinjoinMiddleware';

const rootReducer = combineReducers({
    suite: createReducer({}, {}),
    wallet: combineReducers({
        coinjoin: coinjoinReducer,
    }),
});

type State = ReturnType<typeof rootReducer>;
type InitState = { coinjoin?: Partial<State['wallet']['coinjoin']> };

const initStore = ({ coinjoin }: InitState = {}) => {
    const preloadedState: State = rootReducer(undefined, { type: 'init' });

    if (coinjoin) {
        preloadedState.wallet.coinjoin = {
            ...preloadedState.wallet.coinjoin,
            ...coinjoin,
        };
    }

    const store = configureMockStore({
        reducer: rootReducer,
        preloadedState,
        middleware: [coinjoinMiddleware],
    });

    return store;
};

describe('coinjoinMiddleware', () => {
    it('shifts sessionPhase queue in 3s when there are several simmultaionus phase changes', () => {
        const store = initStore(sessionPhaseFixture.state);

        jest.useFakeTimers();

        sessionPhaseFixture.actions.forEach(action => store.dispatch(action));
        expect(store.getActions()).toEqual(sessionPhaseFixture.immediateResult);

        jest.advanceTimersByTime(SESSION_PHASE_TRANSITION_DELAY);
        expect(store.getActions()).toEqual(sessionPhaseFixture.firstShift);

        jest.advanceTimersByTime(SESSION_PHASE_TRANSITION_DELAY);
        expect(store.getActions()).toEqual(sessionPhaseFixture.secondShift);

        jest.useRealTimers();
    });
});
