import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { DUST_PHISHING_THRESHOLD } from '@suite-common/token-definitions';

import { phishingActions } from './phishingActions';
import { type PhishingState } from './phishingReducerTypes';

export const phishingInitialState: PhishingState = {
    dustThreshold: DUST_PHISHING_THRESHOLD,
};

export const preparePhishingReducer = createReducerWithExtraDeps(
    phishingInitialState,
    (builder, extra) => {
        builder
            .addCase(phishingActions.setDustThreshold, (state, { payload }) => {
                state.dustThreshold = payload.dustThreshold;
            })
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                extra.reducers.storageLoadPhishingMetadata,
            );
    },
);
