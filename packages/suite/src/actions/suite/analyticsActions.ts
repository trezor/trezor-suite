import { GetState, Dispatch } from '@suite-types';
import { SUITE } from '@suite-actions/constants';

// todo: proper url and make sure that we dont trigger it in tests!
const URL = 'http://localhost:3000';

// todo: decide format of data
const encodePayload = (data: object) => {
    return encodeURI(JSON.stringify(data));
};

export const log = (data: object) => async (_dispatch: Dispatch, _getState: GetState) => {
    try {
        const payload = encodePayload(data);
        // todo: would be nice to have some util for fetching. It would help in native, we probably
        // dont want to rewrite entire analytics action there just to make fetch work
        fetch(`${URL}?log=${payload}`);
    } catch (err) {
        console.error(err);
    }
};

export const toggleAnalytics = () => ({
    type: SUITE.TOGGLE_ANALYTICS,
});
