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
        <P data-test="no-firmware-message">Device has no firmware installed.</P>
        <Button onClick={() => props.goto('onboarding-index')}>Go to setup wizard</Button>
    </>
);

export default connect(null, mapDispatchToProps)(Index);
