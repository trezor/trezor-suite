/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

export const WalletSettings = (props: any): any => {
    return (
        <section className="settings">
            Wallet settings
        </section>
    );
}

const mapStateToProps = (state, own) => {
    return {
    
    };
}

const mapDispatchToProps = (dispatch) => {
    return { 
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(WalletSettings);
