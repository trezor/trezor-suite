/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { httpRequest } from '../utils/networkUtils';
import { resolveAfter } from '../utils/promiseUtils';

const loadRateAction = (): any => {
    return async (dispatch, getState) => {
        try {
            const rate = await httpRequest('https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=USD', 'json');

            dispatch({
                type: 'rate__update',
                rate: rate[0]
            })

        } catch(error) {
            
        }

        await resolveAfter(50000);
        // dispatch( loadRateAction() );
    }
}

/**
 * Middleware 
 */
const LocalStorageService = (store: any) => (next: any) => (action: any) => {

    if (action.type === LOCATION_CHANGE && !store.getState().router.location) {
        store.dispatch(loadRateAction());
    }

    next(action);
};

export default LocalStorageService;