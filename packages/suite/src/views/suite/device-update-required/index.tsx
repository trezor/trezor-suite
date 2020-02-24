import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import { Button, P } from '@trezor/components';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => (
    <>
        <P data-test="firmware-required-message">
            Your device has firmware that is no longer supported. You will need to update it.
        </P>
        <Button onClick={() => props.goto('firmware-index')}>See details</Button>
    </>
);

export default connect(null, mapDispatchToProps)(Index);
