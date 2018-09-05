/* @flow */


import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Notification } from 'components/Notification';
import * as TrezorConnectActions from 'actions/TrezorConnectActions';

import type { State, Dispatch } from 'flowtype';

const Wrapper = styled.div``;

type Props = {
    acquiring: boolean;
    acquireDevice: typeof TrezorConnectActions.acquire
}

const UnreadableDevice = (props: Props) => (
    <Wrapper>
        <Notification
            title="Unreadable device"
            message="Please install bridge"
            type="error"
            cancelable={false}
        />
    </Wrapper>
);

export default connect(
    (state: State) => ({
        acquiring: state.connect.acquiring,
    }),
    (dispatch: Dispatch) => ({
        acquireDevice: bindActionCreators(TrezorConnectActions.acquire, dispatch),
    }),
)(UnreadableDevice);
