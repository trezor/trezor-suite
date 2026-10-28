import { referAFriendInitialState, referAFriendReducer } from '@suite-common/refer-a-friend';
import { createSliceWithExtraDeps } from '@trezor/redux-utils';

import { storageLoad } from '../suite/storageLifecycleActions';

export const referAFriendSlice = createSliceWithExtraDeps({
    name: 'referAFriend',
    initialState: referAFriendInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(storageLoad, (state, action) => {
                if (action.payload.referAFriend) {
                    return {
                        ...state,
                        ...action.payload.referAFriend,
                    };
                }
            })
            .addDefaultCase((state, action) => {
                referAFriendReducer(state, action);
            });
    },
});
