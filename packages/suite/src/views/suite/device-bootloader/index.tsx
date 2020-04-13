import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import * as firmwareActions from '@firmware-actions/firmwareActions';

import { Button } from '@trezor/components';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    setStatus: bindActionCreators(firmwareActions.setStatus, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => (
    <DeviceInvalidModeLayout
        title={<Translation id="TR_DEVICE_IN_BOOTLOADER" />}
        text={<Translation id="TR_DEVICE_IN_BOOTLOADER_EXPLAINED" />}
        allowSwitchDevice
        resolveButton={
            <Button
                onClick={() => {
                    props.setStatus('check-seed');
                    props.goto('firmware-index');
                }}
            >
                <Translation id="TR_GO_TO_FIRMWARE" />
            </Button>
        }
    />
);

export default connect(null, mapDispatchToProps)(Index);
