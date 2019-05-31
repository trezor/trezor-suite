import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Text } from 'react-native';
import { Button } from '@trezor/components';
import Wrapper from '@suite/components/SuiteWrapper';
import { State, Dispatch } from '@suite/types';
import { goto } from '@suite/actions/routerActions';

const onClick = () => {};

interface Props {
    suite: State['suite'];
    router: State['router'];
    goto: typeof goto;
}

const UI = (props: Props) => {
    return (
        <Wrapper>
            <Text>Home {props.router.pathname}</Text>
            <Button
                variant="info"
                onClick={() => {
                    props.goto('/');
                }}
            >
                Go to /
            </Button>
            <Button variant="success" onClick={onClick}>
                Button
            </Button>
            <Button variant="warning" onClick={onClick}>
                Button
            </Button>
            <Button variant="error" onClick={onClick}>
                Button
            </Button>
            <Button variant="info" onClick={onClick}>
                Button
            </Button>
            <Button isWhite variant="info" onClick={onClick}>
                Button
            </Button>
            <Button isDisabled variant="info" onClick={onClick}>
                Button
            </Button>

            <Button isLoading variant="success" onClick={onClick}>
                Button
            </Button>
            <Button isLoading variant="warning" onClick={onClick}>
                Button
            </Button>
            <Button isLoading variant="error" onClick={onClick}>
                Button
            </Button>
            <Button isLoading variant="info" onClick={onClick}>
                Button
            </Button>

            <Button isInverse variant="success" onClick={onClick}>
                Button
            </Button>
            <Button isInverse variant="warning" onClick={onClick}>
                Button
            </Button>
            <Button isInverse variant="error" onClick={onClick}>
                Button
            </Button>
            <Button isInverse variant="info" onClick={onClick}>
                Button
            </Button>
            <Button variant="success" onClick={onClick} isDisabled>
                Button disabled
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
)(UI);
