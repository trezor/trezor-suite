/* @flow */


import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Notification } from 'components/Notification';
import * as TrezorConnectActions from 'actions/TrezorConnectActions';

import type { State, Dispatch } from 'flowtype';

const Wrapper = styled.div``;

const UnreadableDevice = () => (
    <Wrapper>
        <Notification
            title="Unreadable device"
            message="Please install bridge"
            type="error"
            cancelable={false}
        />
    </Wrapper>
);

export default connect(null, null)(UnreadableDevice);
