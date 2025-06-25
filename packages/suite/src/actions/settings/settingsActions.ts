import { createAction } from '@reduxjs/toolkit';

import { SUITE } from 'src/actions/suite/constants';

export const setLocalFirstStorageRelayAction = createAction(
    SUITE.SET_LOCAL_FIRST_STORAGE_RELAY,
    ({ url }: { url: string }) => ({ payload: { url } }),
);
