import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Text, Button, View } from 'react-native';

import * as deviceSettingsActions from '@suite-actions/deviceSettingsActions';
import * as routerActions from '@suite-actions/routerActions';

import { AppState, Dispatch } from '@suite-types';

import { SUITE } from '@suite-actions/constants';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    applySettings: bindActionCreators(deviceSettingsActions.applySettings, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Settings = ({ device, applySettings }: Props) => {
    const [label, setLabel] = useState('');

    useEffect(() => {
        if (!device) {
            return;
        }
        setLabel(device.label);
    }, [device]);

    if (!device || !device.features) {
        return null;
    }

    const { features } = device;

    return (
        <View>
            <Text>Settings</Text>
            <View>
                <Button
                    title="Apply settings"
                    onPress={() => {
                        applySettings({ label: 'mobile' });
                    }}
                />
            </View>
        </View>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Settings);
