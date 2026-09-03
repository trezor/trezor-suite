import { type UnknownAction } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';

import { initStakeDataThunk } from './stakingThunks';
import { changeNetworks } from '../settings/walletSettingsActions';

type StakeMiddlewareState = void;

export const prepareStakeMiddleware = createMiddlewareWithExtraDeps<
    void,
    UnknownAction,
    StakeMiddlewareState
>((action, { dispatch, next }) => {
    next(action);

    if (changeNetworks.match(action)) {
        dispatch(initStakeDataThunk());
    }

    return action;
});
