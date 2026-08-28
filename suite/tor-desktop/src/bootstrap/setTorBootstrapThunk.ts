import type { Dispatch } from '@reduxjs/toolkit';

import { type TorRootState, selectTorBootstrap, torActions } from '@suite/tor';
import { type TorBootstrap } from '@suite/tor-types';

type SetTorBootstrapThunkState = TorRootState;

export const setTorBootstrapThunk =
    (torBootstrap: TorBootstrap) =>
    (dispatch: Dispatch, getState: () => SetTorBootstrapThunkState) => {
        const previousTorBootstrap = selectTorBootstrap(getState());

        const payload: TorBootstrap = {
            current: torBootstrap.current,
            total: torBootstrap.total,
            isSlow: previousTorBootstrap ? previousTorBootstrap.isSlow : false,
        };

        dispatch(torActions.setTorBootstrap(payload));
    };
