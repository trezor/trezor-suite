/* @flow */
'use strict';

import React from 'react';
import { render } from 'react-dom';
import store from './store';
import router from './router';
import { onBeforeUnload } from './actions/WalletActions';

import Raven from 'raven-js';

import styles from '../styles/index.less';


Raven.config('https://497392c3ff6e46dc9e54eef123979378@sentry.io/294339').install();

render(
    router,
    document.getElementById('root')
);

window.onbeforeunload = () => {
    store.dispatch( onBeforeUnload() );
}

// workaround
// yarn add web3@^0.19.0