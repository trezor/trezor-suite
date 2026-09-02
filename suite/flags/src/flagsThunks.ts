import { createThunk } from '@suite-common/redux-utils';

import { FLAGS_MODULE_PREFIX } from './flagsConstants';
import { setFlag } from './flagsSlice';

type InitialRunCompletedParams = {
    // Whether the user has just set up a device from scratch (create or recovery), as opposed to
    // only pairing an already set up device with a fresh Suite.
    isFreshDeviceSetup: boolean;
};

export const initialRunCompletedThunk = createThunk<void, InitialRunCompletedParams, void>(
    `${FLAGS_MODULE_PREFIX}/initialRunCompleted`,
    ({ isFreshDeviceSetup }, { dispatch }) => {
        dispatch(setFlag({ key: 'initialRun', value: false }));

        // Only offer the feedback banner to users arriving from a fresh device setup. Pairing an
        // already set up device (e.g. on a new Suite installation) must not enable it. The banner is
        // session-only, so completing onboarding again later re-enables it for that session.
        if (isFreshDeviceSetup) {
            dispatch(setFlag({ key: 'showOnboardingFeedbackBanner', value: true }));
        }
    },
);
