import { type ReduxStoreWithThunk } from './createReduxExtra';
import { type Dispatch } from './hooks/useDispatch';

export type StoreDep = {
    store: ReduxStoreWithThunk<any, any>;
};

export type DispatchDep = {
    dispatch: Dispatch;
};

export type GetStateDep = {
    getState: () => any;
};

export const selectStore = (services: StoreDep): StoreDep => ({ store: services.store });

export const selectDispatch = (services: { store: DispatchDep }): DispatchDep => ({
    dispatch: services.store.dispatch,
});

export const selectGetState = (services: { store: GetStateDep }): GetStateDep => ({
    getState: services.store.getState,
});
