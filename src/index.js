/* @flow */
import React from 'react';
import { render } from 'react-dom';
import baseStyles from 'support/styles';
import App from 'views/index';

const root: ?HTMLElement = document.getElementById('trezor-wallet-root');
if (root) {
    baseStyles();
    render(<App />, root);
}

window.onbeforeunload = () => {
    // $FlowIssue: render empty component
    render(null, root);
};

// Application life cycle starts in services/WalletService.js