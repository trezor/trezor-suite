/* @flow */
import React from 'react';
import { render } from 'react-dom';
import { Normalize } from 'styled-normalize';
import BaseStyles from 'support/styles';
import App from 'views/index';

const root: ?HTMLElement = document.getElementById('trezor-wallet-root');
if (root) {
    render(
        <React.Fragment>
            <Normalize />
            <BaseStyles />
            <App />
        </React.Fragment>,
        root
    );
}

window.onbeforeunload = () => {
    // $FlowIssue: render empty component
    render(null, root);
};

// Application life cycle starts in services/WalletService.js
