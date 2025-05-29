import { createThunk } from '@suite-common/redux-utils';
import { desktopApi } from '@trezor/suite-desktop-api';

import { selectBioAuthEnabled, selectIsRequestingBioAuthChange } from 'src/reducers/desktop';

import { requestBioAuthChange, requestBioAuthChangeEnd, setBioAuthEnabled } from './suiteActions';

const BIO_AUTH_PREFIX = '@suite/bioAuth';

export const requestBioAuthChangeThunk = createThunk(
    `${BIO_AUTH_PREFIX}/requestBioAuthChangeThunk`,
    async (_, { dispatch, getState }) => {
        const prevBioEnabled = selectBioAuthEnabled(getState());
        const isRequestingChange = selectIsRequestingBioAuthChange(getState());
        const nextBioEnabled = !prevBioEnabled;

        if (isRequestingChange) {
            return;
        }

        dispatch(requestBioAuthChange(nextBioEnabled));

        // NOTE: async stuff here

        try {
            await desktopApi.validateBioAuth();

            dispatch(setBioAuthEnabled(nextBioEnabled));
        } finally {
            dispatch(requestBioAuthChangeEnd());
        }
    },
);
