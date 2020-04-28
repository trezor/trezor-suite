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
        data-test="@device-invalid-mode/update-required"
        title={<Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />}
        text={<Translation id="TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED" />}
        allowSwitchDevice
        resolveButton={
            <Button onClick={() => props.goto('firmware-index')}>
                <Translation id="TR_SEE_DETAILS" />
            </Button>
        }
    />
);

export default connect(null, mapDispatchToProps)(Index);
