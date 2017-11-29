/* @flow */
'use strict';

import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import store, { history } from './store';
import router from './router';
import { onResize } from './actions/DOMActions';

import styles from '../styles/index.less';

render(
    <Provider store={store}>
        <ConnectedRouter history={history}>
            { router }
        </ConnectedRouter>
    </Provider>,
    document.getElementById('root')
);

window.addEventListener('resize', () => {
    store.dispatch(onResize());
});