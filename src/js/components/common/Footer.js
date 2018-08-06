/* @flow */


import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as LogActions from '~/js/actions/LogActions';
import type { State, Dispatch } from '~/flowtype';

type Props = {
    toggle: typeof LogActions.toggle
}

const Footer = (props: Props): React$Element<string> => (
    <footer>
        <span>© 2018</span>
        <a href="http://satoshilabs.com" target="_blank" rel="noreferrer noopener" className="satoshi green">SatoshiLabs</a>
        <a href="tos.pdf" target="_blank" rel="noreferrer noopener" className="green">Terms</a>
        <a onClick={props.toggle} className="green">Show Log</a>
    </footer>
);

export default connect(
    (state: State) => ({

    }),
    (dispatch: Dispatch) => ({
        toggle: bindActionCreators(LogActions.toggle, dispatch),
    }),
)(Footer);
