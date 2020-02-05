import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import { AppState, Dispatch } from '@suite-types';
import OnlineStatus from './OnlineStatus';
import UpdateBridge from './UpdateBridge';
import UpdateFirmware from './UpdateFirmware';
import NoBackup from './NoBackup';

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

export type Props = {
    children?: React.ReactNode;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const Notifications = (props: Props) => (
    <>
        <OnlineStatus isOnline={props.suite.online} />
        <UpdateBridge transport={props.suite.transport} goto={props.goto} />
        <UpdateFirmware
            device={props.suite.device}
            pathname={props.router.pathname}
            goto={props.goto}
        />
        <NoBackup device={props.suite.device} pathname={props.router.pathname} goto={props.goto} />
        {/* TODO: add Failed backup */}
        {/* TODO: add Pin not set */}
    </>
);

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);
