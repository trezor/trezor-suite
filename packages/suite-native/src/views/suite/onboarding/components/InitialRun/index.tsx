import React from 'react';
import { View, Text, Button } from 'react-native';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useTheme } from '@trezor/components';
import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import styles from '@native/support/suite/styles';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    initialRunCompleted: bindActionCreators(suiteActions.initialRunCompleted, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const InitialRun = (props: Props) => {
    const theme = useTheme();
    return (
        <View style={styles(theme).container}>
            <Text style={styles(theme).h1}>Initial run</Text>
            <Text>What is your intention?</Text>
            <View style={{ margin: 20 }}>
                <Button onPress={props.initialRunCompleted} title="I'm new. Start onboarding" />
            </View>
            <Button
                color="gray"
                onPress={() => {
                    props.initialRunCompleted();
                    props.goto('suite-index');
                }}
                title="I want to use suite now"
            />
        </View>
    );
};

export default connect(null, mapDispatchToProps)(InitialRun);
