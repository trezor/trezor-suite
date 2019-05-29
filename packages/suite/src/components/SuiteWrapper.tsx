import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { Text, View } from 'react-native';
import { bindActionCreators } from 'redux';

import { goto } from '@suite/actions/RouterActions';

interface Props {
    goto: typeof goto;
}

const Wrapper: FunctionComponent<Props> = props => {
    return (
        <View>
            <Text>Suite wrapper</Text>
            {props.children}
        </View>
    );
};

export default connect(
    null,
    dispatch => ({
        goto: bindActionCreators(goto, dispatch),
    }),
)(Wrapper);
