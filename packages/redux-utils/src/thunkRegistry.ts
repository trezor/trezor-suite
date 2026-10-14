import { type AsyncThunkAction } from '@reduxjs/toolkit';

/**
 * Any thunk: a callable with a type prefix. Two `AsyncThunk` types are not compatible.
 */
export type RegisteredThunk = {
    typePrefix: string;
    (arg: any): AsyncThunkAction<any, any, any>;
};

const registeredThunks = new Map<string, RegisteredThunk>();

/**
 * Lets automation tools dispatch a thunk by its type prefix, module-internal thunks included.
 */
export const registerThunk = (thunk: RegisteredThunk) => {
    registeredThunks.set(thunk.typePrefix, thunk);
};

export const getRegisteredThunk = (typePrefix: string): RegisteredThunk | undefined =>
    registeredThunks.get(typePrefix);

export const getRegisteredThunkTypePrefixes = (): string[] => [...registeredThunks.keys()];
