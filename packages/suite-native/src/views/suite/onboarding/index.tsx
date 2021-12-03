import React from 'react';
import { View, Text, Button } from 'react-native';
import { useTheme } from '@trezor/components';
import { useSelector, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import styles from '@native/support/suite/styles';
import InitialRun from './components/InitialRun';

const Onboarding = () => {
    const theme = useTheme();
    const initialRun = useSelector(state => state.suite.flags.initialRun);
    const actions = useActions({
        goto: routerActions.goto,
        back: routerActions.back,
        initialRunCompleted: suiteActions.initialRunCompleted,
    });

    // TODO: "initialRun" view should not depend on props.initialRun
    if (initialRun) {
        return <InitialRun />;
    }

    return (
        <View>
            <Text style={styles(theme).h1}>Onboarding</Text>
            <View style={{ margin: 20 }}>
                <Text>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam
                </Text>
            </View>
            <View style={{ margin: 20 }}>
                <Button
                    onPress={() => {
                        actions.initialRunCompleted();
                        actions.back();
                    }}
                    title="Go to suite"
                />
            </View>
            <Button
                onPress={() => {
                    actions.goto('wallet-index');
                    actions.initialRunCompleted();
                }}
                title="Go to wallet first page"
            />
        </View>
    );
};

export default Onboarding;
