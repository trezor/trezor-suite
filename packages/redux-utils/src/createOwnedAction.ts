import { type PayloadActionCreator, type PrepareAction, createAction } from '@reduxjs/toolkit';

type OwnedActionCreator<PA extends PrepareAction<any>, T extends string> = PayloadActionCreator<
    ReturnType<PA>['payload'],
    T,
    PA
>;

export type OwnedActionMatcher<PA extends PrepareAction<any>, T extends string> = Pick<
    OwnedActionCreator<PA, T>,
    'type' | 'match'
>;

/**
 * Creates an action that only its owning module can dispatch, e.g. because a thunk there has to run
 * a side effect with it. The module keeps `create` private and exports `matcher`, which reducers and
 * middlewares use to handle the action but which cannot create it.
 */
export const createOwnedAction = <PA extends PrepareAction<any>, T extends string>(
    type: T,
    prepare: PA,
): { create: OwnedActionCreator<PA, T>; matcher: OwnedActionMatcher<PA, T> } => {
    const create = createAction(type, prepare);

    return { create, matcher: { type: create.type, match: create.match } };
};
