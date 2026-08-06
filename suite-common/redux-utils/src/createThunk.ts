import {
    type AsyncThunk,
    type AsyncThunkConfig,
    type AsyncThunkOptions,
    type AsyncThunkPayloadCreator,
    type ThunkDispatch,
    type UnknownAction,
    createAsyncThunk as createAsyncThunkReduxToolkit,
} from '@reduxjs/toolkit';

// TODO: This dependency on the global ExtraDependencies type is bad, temporary, terrible, and
// disastrous. Remove it in follow-ups tracked by https://github.com/trezor/trezor-suite/issues/30770.
import { type CustomThunkAPI } from '@suite-common/redux-extra-dependencies';

type DefaultThunkAPI = { readonly __defaultThunkAPI: unique symbol };
type CreateThunkDispatch = ThunkDispatch<any, any, UnknownAction>;

/**
 * Resolves the thunk API while thunks are migrated away from the global `CustomThunkAPI`:
 * - omitted config keeps the complete global API;
 * - `void` provides unknown state and no extra dependencies;
 * - config with `state` opts into selective state and either explicit or no extra dependencies;
 * - config without `state` overrides only its declared fields and keeps the remaining global API.
 *
 * Dispatch is always replaced with a broad thunk dispatch so selectively typed parent and child
 * thunks remain composable during the migration.
 */
type ResolveThunkAPI<TThunkAPI> = [TThunkAPI] extends [DefaultThunkAPI]
    ? CustomThunkAPI & { dispatch: CreateThunkDispatch }
    : [TThunkAPI] extends [void]
      ? { state: unknown; extra: Record<never, never>; dispatch: CreateThunkDispatch }
      : TThunkAPI extends { state: unknown }
        ? Omit<CustomThunkAPI, keyof TThunkAPI | 'dispatch' | 'extra'> &
              TThunkAPI & {
                  extra: TThunkAPI extends { extra: infer TExtra } ? TExtra : Record<never, never>;
                  dispatch: CreateThunkDispatch;
              }
        : Omit<CustomThunkAPI, keyof TThunkAPI | 'dispatch'> &
              TThunkAPI & { dispatch: CreateThunkDispatch };

type CreateThunk = <
    TReturned = void,
    TThunkArg = void,
    TThunkAPI extends AsyncThunkConfig | void | DefaultThunkAPI = DefaultThunkAPI,
>(
    typePrefix: string,
    thunk: AsyncThunkPayloadCreator<TReturned, TThunkArg, ResolveThunkAPI<TThunkAPI>>,
    options?: AsyncThunkOptions<TThunkArg, ResolveThunkAPI<TThunkAPI>>,
) => AsyncThunk<TReturned, TThunkArg, ResolveThunkAPI<TThunkAPI>>;

export const createThunk: CreateThunk = createAsyncThunkReduxToolkit;
