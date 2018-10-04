/* @flow */
import React from 'react';
import { render } from 'react-dom';
import baseStyles from 'support/styles';
import { onBeforeUnload } from 'actions/WalletActions';
import App from 'views/index';
import store from './store';

const root: ?HTMLElement = document.getElementById('root');
if (root) {
    baseStyles();
    render(<App />, root);
}

window.onbeforeunload = () => {
    store.dispatch(onBeforeUnload());
};

// Application life cycle starts in services/WalletService.js