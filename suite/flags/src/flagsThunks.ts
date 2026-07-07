import { createThunk } from '@suite-common/redux-utils';

import { FLAGS_MODULE_PREFIX } from './flagsConstants';
import { setFlag } from './flagsSlice';

export const initialRunCompleted = createThunk(
    `${FLAGS_MODULE_PREFIX}/initialRunCompleted`,
    (_, { dispatch }) => {
        dispatch(setFlag({ key: 'initialRun', value: false }));
        // Re-enable the onboarding feedback banner on every onboarding completion, so a user
        // going through onboarding again (e.g. a newly set up device) sees the banner again.
        dispatch(setFlag({ key: 'showOnboardingFeedbackBanner', value: true }));
    },
);
