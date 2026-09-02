import { type ActionCreatorWithPreparedPayload } from '@reduxjs/toolkit';

export type LockDeviceDep = {
    lockDevice: ActionCreatorWithPreparedPayload<[payload: boolean], boolean>;
};
