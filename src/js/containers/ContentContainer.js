/* @flow */
'use strict';

import React from 'react';
import { Route } from 'react-router-dom';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Log from '../components/common/Log';
import Notifications from '../components/common/Notification';
import Footer from '../components/common/Footer';
import AccountTabs from '../components/wallet/account/AccountTabs';

import * as TrezorConnectActions from '../actions/TrezorConnectActions';
import * as LogActions from '../actions/LogActions';

const Article = (props) => {
    return (
        <article>
            <nav>
                <Route path="/device/:device/network/:network/address/:address" component={ AccountTabs } />
            </nav>
            <Notifications />
            <Log />
            { props.children }
            <Footer />
        </article>
    );
}

function mapStateToProps(state, own) {
    return {
   
    };
}

function mapDispatchToProps(dispatch) {
    return {
        
    };
}

export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(Article)
);