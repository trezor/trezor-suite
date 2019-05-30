import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Text } from 'react-native';
import { Button } from '@trezor/components';
import Wrapper from '@suite/components/SuiteWrapper';
import { State, Dispatch } from '@suite/types';
import TrezorConnect from 'trezor-connect';
import { goto } from '@suite/actions/routerActions';

const onClick = () => {
    TrezorConnect.getAddress({
        path: "m/44'/0'/0'/0/0",
        coin: 'btc',
    }).then();
};

interface Props {
    suite: State['suite'];
    router: State['router'];
    goto: typeof goto;
}

const Index = (props: Props) => {
    useEffect(() => {}, [props]);
    return (
        <Wrapper>
            <Text>Home {props.router.pathname}</Text>
            <Button variant="success" onClick={onClick}>
                START
            </Button>
            <Button onClick={onClick} variant="success">
                button
            </Button>
            <Button
                onClick={() => {
                    props.goto('/ui');
                }}
                variant="success"
            >
                ui
            </Button>
        </Wrapper>
    );
};

const mapStateToProps = (state: State) => ({
    suite: state.suite,
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            goto,
        },
        dispatch,
    );

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Index);
