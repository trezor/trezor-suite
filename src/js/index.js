/* @flow */
'use strict';

import React from 'react';
import { render } from 'react-dom';
import store from './store';
import router from './router';
import { onResize, onBeforeUnload } from './actions/AppActions';

import styles from '../styles/index.less';

render(
    router,
    document.getElementById('root')
);

// handle resize event and pass it to DOM reducer
window.addEventListener('resize', () => {
    store.dispatch( onResize() );
});

window.onbeforeunload = () => {
    store.dispatch( onBeforeUnload() );
}

// workaround
// yarn add web3@^0.19.0