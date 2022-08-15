import { AsyncThunkOptions, AsyncThunkPayloadCreator, createAsyncThunk } from '@reduxjs/toolkit';

import { ExtraDependencies } from './extraDependenciesType';

export const createThunk = <TPayload = void, TReturn = void>(
    typePrefix: string,
    thunk: AsyncThunkPayloadCreator<TReturn, TPayload, { state: any; extra: ExtraDependencies }>,
    options?: AsyncThunkOptions<TPayload>,
) => createAsyncThunk(typePrefix, thunk, options);
