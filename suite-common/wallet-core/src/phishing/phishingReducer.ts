import {
    type ActionTypesDep,
    type ReducersDep,
    createReducerWithExtraDeps,
} from '@suite-common/redux-utils';
import { DUST_PHISHING_THRESHOLD } from '@suite-common/token-definitions';

import { phishingActions } from './phishingActions';
import { type PhishingState } from './phishingReducerTypes';

export const phishingInitialState: PhishingState = {
    dustPhishing: {
        isEnabled: true,
        dustThreshold: DUST_PHISHING_THRESHOLD,
    },
};

type PhishingReducerDeps = ActionTypesDep<'storageLoad'> &
    ReducersDep<'storageLoadPhishingMetadata'>;

export const preparePhishingReducer = createReducerWithExtraDeps(
    phishingInitialState,
    (builder, extra: PhishingReducerDeps) => {
        builder
            .addCase(phishingActions.setDustPhishing, (state, { payload }) => {
                state.dustPhishing = payload;
            })
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                extra.reducers.storageLoadPhishingMetadata,
            );
    },
);
