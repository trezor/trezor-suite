import {
    type Store,
    type ThunkDispatch,
    type ThunkMiddleware,
    type UnknownAction,
} from '@reduxjs/toolkit';

type ReduxExtraDeps<TStaticExtra> = { extraDependencies: TStaticExtra };

type ExtraWithServices<TServices, TStaticExtra> = TStaticExtra & { services: TServices };

export type ReduxStoreWithThunk<TState, TExtra> = Store<TState> & {
    dispatch: ThunkDispatch<TState, TExtra, UnknownAction>;
};

type ReduxExtra<TState, TServices, TStaticExtra> = {
    getExtra: () => ExtraWithServices<TServices, TStaticExtra>;
    thunkMiddleware: ThunkMiddleware<
        TState,
        UnknownAction,
        ExtraWithServices<TServices, TStaticExtra>
    >;
    injectServicesIntoReduxExtra: (services: TServices) => void;
};

export const createReduxExtra = <TState, TServices, TStaticExtra>(
    deps: ReduxExtraDeps<TStaticExtra>,
): ReduxExtra<TState, TServices, TStaticExtra> => {
    let extra: ExtraWithServices<TServices, TStaticExtra> | null = null;

    const getExtra = (): ExtraWithServices<TServices, TStaticExtra> => {
        if (extra === null) {
            throw new Error(
                'Redux services must be injected before dispatching application actions.',
            );
        }

        return extra;
    };

    // Resolve extra at dispatch time: services need the real store to be constructed first.
    const thunkMiddleware: ThunkMiddleware<
        TState,
        UnknownAction,
        ExtraWithServices<TServices, TStaticExtra>
    > =
        ({ dispatch, getState }) =>
        next =>
        action => {
            const currentExtra = getExtra();

            if (typeof action === 'function') {
                return action(dispatch, getState, currentExtra);
            }

            return next(action);
        };

    return {
        getExtra,
        thunkMiddleware,
        // The composition root completes this cycle before application actions are dispatched.
        injectServicesIntoReduxExtra: services => {
            extra = { ...deps.extraDependencies, services };
        },
    };
};
