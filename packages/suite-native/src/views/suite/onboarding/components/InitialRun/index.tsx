import React from 'react';
import { View, Text, Button } from 'react-native';
import { useTheme } from '@trezor/components';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import styles from '@native/support/suite/styles';

const InitialRun = () => {
    const theme = useTheme();
    const actions = useActions({
        goto: routerActions.goto,
        initialRunCompleted: suiteActions.initialRunCompleted,
    });
    return (
        <View style={styles(theme).container}>
            <Text style={styles(theme).h1}>Initial run</Text>
            <Text>What is your intention?</Text>
            <View style={{ margin: 20 }}>
                <Button onPress={actions.initialRunCompleted} title="I'm new. Start onboarding" />
            </View>
            <Button
                color="gray"
                onPress={() => {
                    actions.initialRunCompleted();
                    actions.goto('suite-index');
                }}
                title="I want to use suite now"
            />
        </View>
    );
};

export default InitialRun;
