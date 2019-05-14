import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import { StartButton } from '@trezor/components/StartButton';
import Wrapper from '@suite/components/SuiteWrapper';
import { State } from '@suite/types';

const onClick = () => {
    // TrezorConnect.getPublicKey();
};

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
            <StartButton onPress={onClick} />
        </Wrapper>
    );
};

const mapStateToProps = (state: State) => ({
    suite: state.suite,
    router: state.router,
});

export default connect(mapStateToProps)(Index);
