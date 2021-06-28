// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceBootloader

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as routerActions from '@suite-actions/routerActions';
import { Button } from '@trezor/components';
import { DeviceInvalidModeLayout, Translation } from '@suite-components';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goto: routerActions.goto,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapDispatchToProps>;

const Index = (props: Props) => (
    <DeviceInvalidModeLayout
        data-test="@device-invalid-mode/bootloader"
        title={<Translation id="TR_DEVICE_IN_BOOTLOADER" />}
        text={<Translation id="TR_DEVICE_IN_BOOTLOADER_EXPLAINED" />}
        allowSwitchDevice
        resolveButton={
            <Button
                onClick={() => {
                    props.goto('firmware-index');
                }}
            >
                <Translation id="TR_GO_TO_FIRMWARE" />
            </Button>
        }
    />
);

export default connect(null, mapDispatchToProps)(Index);
