import { createThunk } from '@suite-common/redux-utils';

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

        await new Promise<void>(resolve => {
            setTimeout(() => {
                resolve();
            }, 2000);
        });

        dispatch(setBioAuthEnabled(nextBioEnabled));

        dispatch(requestBioAuthChangeEnd());
    },
);
