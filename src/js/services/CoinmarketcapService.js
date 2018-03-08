/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import { httpRequest } from '../utils/networkUtils';
import { resolveAfter } from '../utils/promiseUtils';

const loadRateAction = (): any => {
    return async (dispatch, getState) => {
        const config = getState().localStorage.config;
        try {

            for (let i = 0; i < config.fiatValueTickers.length; i++) {
                const rate = await httpRequest(`${config.fiatValueTickers[i].url}?convert=USD`, 'json');
                dispatch({
                    type: 'rate__update',
                    network: config.fiatValueTickers[i].network,
                    rate: rate[0]
                });
            }

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

    next(action);

    //if (action.type === LOCATION_CHANGE && !store.getState().router.location) {
    if (action.type === 'storage__ready') {
        store.dispatch(loadRateAction());
    }
};

export default LocalStorageService;