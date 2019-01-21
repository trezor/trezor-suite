import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as NotificationActions from 'actions/NotificationActions';
import * as RouterActions from 'actions/RouterActions';

import OnlineStatus from './components/OnlineStatus';
import UpdateBridge from './components/UpdateBridge';
import UpdateFirmware from './components/UpdateFirmware';

const Notifications = props => (
    <React.Fragment>
        <OnlineStatus {...props} />
        <UpdateBridge {...props} />
        <UpdateFirmware {...props} />
    </React.Fragment>
);

const mapStateToProps = state => ({
    connect: state.connect,
    wallet: state.wallet,
});

const mapDispatchToProps = dispatch => ({
    close: bindActionCreators(NotificationActions.close, dispatch),
    routerActions: bindActionCreators(RouterActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);