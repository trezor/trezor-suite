import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import { bindActionCreators } from 'redux';

import { Header } from '@trezor/components/Header';
import { goto } from '@suite/actions/RouterActions';

interface Props {
    goto: typeof goto;
}

const Wrapper: FunctionComponent<Props> = props => {
    return (
        <>
            <Header onClick={props.goto} />
            <Text>Suite wrapper</Text>
            {props.children}
        </>
    );
};

export default connect(
    null,
    dispatch => ({
        goto: bindActionCreators(goto, dispatch),
    }),
)(Wrapper);
