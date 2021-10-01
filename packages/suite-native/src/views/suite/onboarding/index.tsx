import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { View, Text, Button } from 'react-native';
import { useTheme } from '@trezor/components';

import * as routerActions from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import styles from '@native/support/suite/styles';
import InitialRun from './components/InitialRun';
import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    initialRun: state.suite.flags.initialRun,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    back: bindActionCreators(routerActions.back, dispatch),
    initialRunCompleted: bindActionCreators(suiteActions.initialRunCompleted, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Onboarding = (props: Props) => {
    const theme = useTheme();

    // TODO: "initialRun" view should not depend on props.initialRun
    if (props.initialRun) {
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
                        props.initialRunCompleted();
                        props.back();
                    }}
                    title="Go to suite"
                />
            </View>
            <Button
                onPress={() => {
                    props.goto('wallet-index');
                    props.initialRunCompleted();
                }}
                title="Go to wallet first page"
            />
        </View>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Onboarding);
