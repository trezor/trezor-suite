import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import * as routerActions from '@suite-actions/routerActions';
import { AppState, Dispatch } from '@suite-types';
import OnlineStatus from './components/OnlineStatus';
import UpdateBridge from './components/UpdateBridge';
import UpdateFirmware from './components/UpdateFirmware';
import NoBackup from './components/NoBackup';

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

const Notifications = (props: Props & WrappedComponentProps) => (
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

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(Notifications));
