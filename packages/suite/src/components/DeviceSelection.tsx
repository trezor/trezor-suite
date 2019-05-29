import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { State } from '@suite/types';
import { selectDevice } from '@suite/actions/suiteActions';
import { Select } from '@trezor/components';

interface Props {
    devices: State['devices'];
    selectedDevice: State['suite']['device'];
    selectDevice: typeof selectDevice;
}

const Selection: FunctionComponent<Props> = props => {
    const { devices, selectedDevice } = props;

    if (!selectedDevice || devices.length < 1) return null;

    const options = devices.map(dev => ({
        label: dev.label,
        value: dev.path,
        device: dev,
    }));

    const onSelect = (option: any) => {
        props.selectDevice(option.device);
    };

    const value = options.find(opt => opt.device === selectedDevice);

    return (
        <Select
            isSearchable={false}
            isAsync={false}
            withDropdownIndicator
            value={value}
            options={options}
            onChange={(option: string) => onSelect(option)}
        />
    );
};

const mapStateToProps = (state: State) => ({
    devices: state.devices,
    selectedDevice: state.suite.device,
});

export default connect(
    mapStateToProps,
    dispatch => ({
        selectDevice: bindActionCreators(selectDevice, dispatch),
    }),
)(Selection);
