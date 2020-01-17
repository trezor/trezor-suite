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
        <P data-test="initialize-message">Device is not set up.</P>
        <Button
            data-test="@button/go-to-onboarding"
            onClick={() => props.goto('onboarding-index', { cancelable: true })}
        >
            Go to setup wizard
        </Button>
    </>
);

export default connect(null, mapDispatchToProps)(Index);
