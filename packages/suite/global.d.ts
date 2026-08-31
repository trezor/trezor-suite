import { type UnknownAction } from '@reduxjs/toolkit';
import { compose } from 'redux';

import { type AppState } from 'src/reducers/store';
import { type ExtraDependenciesSuite } from 'src/support/extraDependencies';

declare module '@suite-common/redux-utils' {
    export interface UseSelectorStateRegistry {
        suite: AppState;
    }
}

/**
 * Shape accepted by Suite's real store when React Redux returns its ordinary `useDispatch()`.
 *
 * The store gives a thunk the complete Suite state and dependencies. A thunk that asks for only a
 * smaller part of either is therefore compatible, while a thunk asking for something Suite does
 * not have is rejected. `dispatch` is `never` deliberately: it fits every thunk's dispatch
 * parameter and prevents TypeScript from recursively checking dispatch inside dispatch forever.
 */
type SuiteCompatibleThunkAction<TReturn> = (
    dispatch: never,
    getState: () => AppState,
    extra: ExtraDependenciesSuite,
) => TReturn;

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
        electronFind: {
            onShow: (callback: () => void) => void;
            offShow: (callback: () => void) => void;
        };
    }
}

declare module 'redux' {
    // `useDispatch()` starts with Redux's plain-action dispatch. This overload teaches it about
    // thunks while proving that the Suite store provides all state and dependencies they require.
    export interface Dispatch<_A extends Action = UnknownAction> {
        <TReturn>(thunkAction: SuiteCompatibleThunkAction<TReturn>): TReturn;
    }
}

export {};
