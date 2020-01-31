import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import { Button, P } from '@trezor/components-v2';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => (
    <>
        <P data-test="initialize-message">Device is in bootloader mode. Reconnect it.</P>
        <Button onClick={() => props.goto('firmware-index')}>Or go to setup wizard</Button>
    </>
);

export default connect(null, mapDispatchToProps)(Index);
