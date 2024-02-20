import { ActionCreatorWithPreparedPayload, createAction, Dispatch } from '@reduxjs/toolkit';

import { ExtraDependencies } from './extraDependenciesType';

type PayloadCreator<TPayload, TReturn> = (
    payload: TPayload,
    args: { dispatch: Dispatch; getState: () => any; extra: ExtraDependencies },
) => TReturn;

// This is basically thunk under-the-hood because this only way how to get access to dispatch, getState and extra
// in payload creator.
export const createActionWithExtraDeps = <TPayload, TReturn, TActionName extends string>(
    actionName: TActionName,
    payloadCreator: PayloadCreator<TPayload, TReturn>,
): ActionCreatorWithPreparedPayload<[payload: TPayload], TReturn, TActionName> => {
    const action = createAction<TPayload>(actionName);

    const thunkAction =
        (payload: TPayload) =>
        (dispatch: Dispatch, getState: () => any, extra: ExtraDependencies) => {
            const resultPayload = payloadCreator(payload, { dispatch, getState, extra });
            const resultAction = action(resultPayload);
            dispatch(action(resultPayload));

            return resultAction;
        };

    thunkAction.type = action.type;
    thunkAction.toString = action.toString;
    thunkAction.match = action.match;

    // return type is already defined and type for thunkAction kind of messed up because it's thunk under-the-hood
    return thunkAction as any;
};
