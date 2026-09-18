import { type ReduxStoreWithThunk } from './createReduxExtra';
import { type Dispatch } from './types';

export type StoreDep = {
    store: ReduxStoreWithThunk<any, any>;
};

export type DispatchDep = {
    dispatch: Dispatch;
};

export type GetStateDep = {
    getState: () => any;
};

export const injectStore = (services: StoreDep): StoreDep => ({ store: services.store });

export const injectDispatch = (services: { store: DispatchDep }): DispatchDep => ({
    dispatch: services.store.dispatch,
});

export const injectGetState = (services: { store: GetStateDep }): GetStateDep => ({
    getState: services.store.getState,
});
