import { createThunk } from '@suite-common/redux-utils';

import { FLAGS_MODULE_PREFIX } from './flagsConstants';
import { selectIsInitialRun, setFlag } from './flagsSlice';

export const initialRunCompleted = createThunk(
    `${FLAGS_MODULE_PREFIX}/initialRunCompleted`,
    (_, { dispatch, getState }) => {
        if (selectIsInitialRun(getState())) {
            dispatch(setFlag({ key: 'initialRun', value: false }));
        }
    },
);
