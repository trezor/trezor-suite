import * as React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import { AppState, Dispatch } from '@suite-types';
import OnlineStatus from './OnlineStatus';
import UpdateBridge from './UpdateBridge';
import UpdateFirmware from './UpdateFirmware';
import NoBackup from './NoBackup';
import FailedBackup from './FailedBackup';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    z-index: 3;
`;

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goto: routerActions.goto,
        },
        dispatch,
    );

export type Props = {
    children?: React.ReactNode;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const Notifications = (props: Props) => (
    <Wrapper>
        <OnlineStatus isOnline={props.suite.online} />
        <UpdateBridge transport={props.suite.transport} goto={props.goto} />
        <UpdateFirmware device={props.suite.device} goto={props.goto} />
        <NoBackup device={props.suite.device} goto={props.goto} />
        <FailedBackup device={props.suite.device} />
        {/* TODO: add Pin not set */}
    </Wrapper>
);

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);
