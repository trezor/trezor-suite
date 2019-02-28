/* @flow */
import React from 'react';
import styled from 'styled-components';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import colors from 'config/colors';
import Notification from 'components/Notification';
import * as TrezorConnectActions from 'actions/TrezorConnectActions';
import type { State, Dispatch } from 'flowtype';
import l10nMessages from './index.messages';

type Props = {
    intl: any,
    acquiring: boolean,
    acquireDevice: typeof TrezorConnectActions.acquire
}

const Wrapper = styled.div`
    display: flex;
    background: ${colors.WHITE};
    flex-direction: column;
    flex: 1;
`;

const Acquire = (props: Props) => (
    <Wrapper>
        <Notification
            title={props.intl.formatMessage(l10nMessages.TR_DEVICE_USED_IN_OTHER)}
            message={props.intl.formatMessage(l10nMessages.TR_USE_YOUR_DEVICE_IN_THIS_WINDOW)}
            type="info"
            cancelable={false}
            isActionInProgress={props.acquiring}
            actions={
                [
                    {
                        label: props.intl.formatMessage(l10nMessages.TR_ACQUIRE_DEVICE),
                        callback: () => {
                            props.acquireDevice();
                        },
                    },
                ]
            }
        />
    </Wrapper>
);

export default injectIntl(connect(
    (state: State) => ({
        acquiring: state.connect.acquiringDevice,
    }),
    (dispatch: Dispatch) => ({
        acquireDevice: bindActionCreators(TrezorConnectActions.acquire, dispatch),
    }),
)(Acquire));
