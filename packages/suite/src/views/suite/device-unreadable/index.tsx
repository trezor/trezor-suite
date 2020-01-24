import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import { P } from '@trezor/components';
import { Button } from '@trezor/components-v2';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => (
    <>
        <P data-test="unreadable-device-message">
            We cant see details about your device. It might be Trezor with old firmware or possibly
            any USB device. To make communication possible, you will need to install Trezor Bridge.
        </P>
        <Button onClick={() => props.goto('suite-bridge')}>See details</Button>
    </>
);

export default connect(null, mapDispatchToProps)(Index);
