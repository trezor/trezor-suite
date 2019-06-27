import * as React from 'react';
import { connect } from 'react-redux';
import { injectIntl, InjectedIntlProps } from 'react-intl';
import { AppState } from '@suite-types/index';
import OnlineStatus from './components/OnlineStatus';
import UpdateBridge from './components/UpdateBridge';
import UpdateFirmware from './components/UpdateFirmware';
import NoBackup from './components/NoBackup';

interface Props {
    suite: AppState['suite'];
    router: AppState['router'];
    children?: React.ReactNode;
}

const Notifications = (props: Props & InjectedIntlProps) => (
    <React.Fragment>
        <OnlineStatus isOnline={props.suite.online} />
        <UpdateBridge transport={props.suite.transport} />
        <UpdateFirmware device={props.suite.device} pathname={props.router.pathname} />
        <NoBackup device={props.suite.device} />
    </React.Fragment>
);

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    router: state.router,
});

export default injectIntl(
    connect(
        mapStateToProps,
        null,
    )(Notifications),
);
