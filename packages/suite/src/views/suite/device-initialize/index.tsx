import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import { Button } from '@trezor/components';
import { Dispatch } from '@suite-types';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => (
    <DeviceInvalidModeLayout
        title={<Translation id="TR_DEVICE_NOT_INITIALIZED" />}
        text={<Translation id="TR_DEVICE_NOT_INITIALIZED_TEXT" />}
        resolveButton={
            <Button
                data-test="@button/go-to-onboarding"
                onClick={() => props.goto('onboarding-index')}
            >
                <Translation id="TR_GO_TO_ONBOARDING" />
            </Button>
        }
        allowSwitchDevice
    />
);

export default connect(null, mapDispatchToProps)(Index);
