import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Text, Platform } from 'react-native';
import { Button } from '@trezor/components';
import Wrapper from '@suite/components/SuiteWrapper';
import { State } from '@suite/types';
import TrezorConnect from 'trezor-connect';
import * as RouterActions from '@suite/actions/RouterActions'

const onClick = () => {
    TrezorConnect.getAddress({
        path: "m/44'/0'/0'/0/0",
        coin: "btc"
    }).then(r => {
        console.log("R", r)
    });
};

const gotoUI = () => {
    console.log("uiii");
    RouterActions.goto("/ui");
}

// TODO: https://redux.js.org/recipes/isolating-redux-sub-apps

let tick = 0;
const started = Date.now();

interface Props {
    suite: State['suite'];
    router: State['router'];
}

const Index = (props: Props) => {
    useEffect(() => {
        const interval = setInterval(() => {
            tick++;
            const time = Date.now() - started;
            console.log('HOME TICK...', tick, time, props); /* eslint-disable-line no-console */
        }, 3000);

        return () => {
            clearInterval(interval);
        };
    }, [props]);
    return (
        <Wrapper>
            <Text>Home {props.router.pathname}</Text>
            <Button onClick={onClick} variant="success">button</Button>
            <Button onClick={gotoUI} variant="success">ui</Button>
        </Wrapper>
    );
};

const mapStateToProps = (state: State) => ({
    suite: state.suite,
    router: state.router,
});

export default connect(mapStateToProps)(Index);
