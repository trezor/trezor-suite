import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import TrezorConnect from 'trezor-connect';

import { Button } from '@trezor/components';
import { AppState, TrezorDevice } from '@suite-types';
import { selectDevice } from '@suite-actions/suiteActions';

interface Props {
    devices: AppState['devices'];
    selectedDevice: AppState['suite']['device'];
    selectDevice: typeof selectDevice;
}

const onClick = async (device: TrezorDevice) => {
    const resp = await TrezorConnect.getFeatures({
        device,
    });

    if (resp.success) {
        // acquire complete!
    }
};

const Selection: FunctionComponent<Props> = props => {
    const { devices, selectedDevice } = props;

    if (!selectedDevice || devices.length < 1) return null;

    return (
        <>
            DEVICE IS USED IN ANOTHER WINDOW
            <Button variant="success" onClick={() => onClick(selectedDevice)}>
                Acquire
            </Button>
        </>
    );
};

const mapStateToProps = (state: AppState) => ({
    devices: state.devices,
    selectedDevice: state.suite.device,
});

export default connect(
    mapStateToProps,
    dispatch => ({
        selectDevice: bindActionCreators(selectDevice, dispatch),
    }),
)(Selection);
