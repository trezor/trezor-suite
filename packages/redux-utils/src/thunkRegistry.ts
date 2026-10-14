import { type AsyncThunkAction } from '@reduxjs/toolkit';

// The registry is heterogeneous by design: every thunk has its own argument, state and dependency
// types, which only the caller supplying `typePrefix` and `arg` at runtime can know. The shape is
// structural (a callable with a type prefix) instead of `AsyncThunk`, whose lifecycle action
// matchers cannot be related across generic thunk factories.
export type RegisteredThunk = {
    typePrefix: string;
    (arg: any): AsyncThunkAction<any, any, any>;
};

const registeredThunks = new Map<string, RegisteredThunk>();

/**
 * Remembers a thunk by its type prefix so automation tooling can dispatch it by name, including
 * thunks a bundle keeps module-internal. `createThunk` and `createSingleInstanceThunk` call it.
 */
export const registerThunk = (thunk: RegisteredThunk) => {
    registeredThunks.set(thunk.typePrefix, thunk);
};

export const getRegisteredThunk = (typePrefix: string): RegisteredThunk | undefined =>
    registeredThunks.get(typePrefix);

export const getRegisteredThunkTypePrefixes = (): string[] => [...registeredThunks.keys()];
