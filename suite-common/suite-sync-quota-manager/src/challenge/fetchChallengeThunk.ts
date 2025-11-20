import { Dispatch } from '@reduxjs/toolkit';

import { err } from '@trezor/type-utils';

import { quotaManagerChallengeFetched } from '../quotaManagerActions';
import { quotaManagerFetch } from '../quotaManagerFetchThunk';
import { selectQuotaManagerBaseUrl } from '../quotaManagerSelectors';

type ChallengeCreateBody = {
    sessionId: string;
};

type ChallengeCreateResponse = {
    challenge: string;
};

export const fetchChallengeThunk =
    (params: ChallengeCreateBody) => async (dispatch: Dispatch, getState: () => any) => {
        const baseUrl = selectQuotaManagerBaseUrl(getState());

        const result = await quotaManagerFetch({
            baseUrl,
            path: '/challenge',
            method: 'POST',
            body: params,
        });

        if (!result.ok) {
            // TODO - throw the fetch action err
            return err(result.error);
        }

        dispatch(
            quotaManagerChallengeFetched({
                challenge: (result.value as ChallengeCreateResponse).challenge,
            }),
        );
    };
