import { Dispatch } from '@reduxjs/toolkit';

import { fetchChallengeThunk } from './challenge/fetchChallengeThunk';
import { quotaManagerSessionIdGenerated } from './quotaManagerActions';
import { selectQuotaManagerSessionId } from './quotaManagerSelectors';
import { generateSessionId } from './util/generateSessionId';

export const prepareChallengeThunk = () => async (dispatch: Dispatch, getState: () => any) => {
    // session ID is persistent for the duration of the app session
    const storedSessionId = selectQuotaManagerSessionId(getState());
    const sessionId = storedSessionId || generateSessionId();

    if (!storedSessionId) {
        dispatch(quotaManagerSessionIdGenerated({ sessionId }));
    }

    await dispatch(fetchChallengeThunk({ sessionId }));
};
