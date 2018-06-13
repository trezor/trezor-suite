/* @flow */
'use strict';

import React from 'react';
import { render } from 'react-dom';
import store from './store';
import router from './router';
import { onResize, onBeforeUnload } from './actions/DOMActions';
import styles from '../styles/index.less';

const root: ?HTMLElement = document.getElementById('root');
if (root) {
    render(router, root);
}

window.onbeforeunload = () => {
    store.dispatch( onBeforeUnload() );
}

if (typeof module !== undefined && module.hasOwnProperty('hot')) {
    // $FlowIssue
    module.hot.accept();
}

window.addEventListener('resize', () => {
    store.dispatch(onResize());
});