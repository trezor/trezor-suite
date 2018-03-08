/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as LogActions from '../../actions/LogActions';

const Footer = (props: any): any => {
    return (
        <footer>
            <span>© 2018</span>
            <a href="http://satoshilabs.com" target="_blank" rel="noreferrer noopener" className="satoshi green">SatoshiLabs</a>
            <a href="tos.pdf" target="_blank" rel="noreferrer noopener" className="green">Terms</a>
            <a onClick={ props.toggle } className="green">Show Log</a>
        </footer>
    );
}

export default connect( 
    (state) => {
        return {
            
        }
    },
    (dispatch) => {
        return { 
            toggle: bindActionCreators(LogActions.toggle, dispatch),
        };
    }
)(Footer);
