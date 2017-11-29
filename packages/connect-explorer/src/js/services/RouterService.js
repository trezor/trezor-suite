/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';

/**
 * Middleware used for managing router path and
 * checking if all required devices are online.
 * It starts right before action is passed to reducers and add "alive" filed to every action
 * which determining if current path is Adam or not
 */
const RouterService = store => next => action => {
    if (action.type === LOCATION_CHANGE) {

    }

    next(action);
};

export default RouterService;