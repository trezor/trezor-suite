import type { AsyncThunkAction, UnknownAction } from '@reduxjs/toolkit';
import type { Store as ReduxStore } from 'redux';
import type { ThunkAction as TAction, ThunkDispatch } from 'redux-thunk';

import { type Route } from '@suite/router';
import { type ExtraDependencies } from '@suite-common/redux-extra-dependencies';

import type { AppState } from 'src/reducers/store';

// reexport
export type {
    AcquiredDevice,
    ButtonRequest,
    ExtendedDevice,
    TrezorDevice,
    UnknownDevice,
    UnreadableDevice,
} from '@suite-common/suite-types';
export type { AppState } from 'src/reducers/store';
export type { PrerequisiteType } from 'src/utils/suite/prerequisites';
export type { Route };

export type ThunkAction = TAction<any, AppState, any, UnknownAction>;

export type Dispatch = {
    <T>(thunkAction: (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => T): T;
    <T extends AsyncThunkAction<any, any, any>>(asyncThunkAction: T): ReturnType<T>;
} & ThunkDispatch<AppState, any, UnknownAction>;

export type GetState = () => AppState;

export type Store = ReduxStore<AppState, UnknownAction>;

export type ForegroundAppRoute = Extract<
    Route,
    { isForegroundApp: true; isFullscreenApp: false | undefined }
>;

export type ForegroundAppProps = {
    cancelable: boolean;
    onCancel: (preserveParams?: boolean) => void;
};

export type ToastNotificationVariant = 'success' | 'info' | 'warning' | 'error' | 'transparent';

export enum DisplayMode {
    CHUNKS = 1,
    PAGINATED_TEXT,
    SINGLE_WRAPPED_TEXT,
}
