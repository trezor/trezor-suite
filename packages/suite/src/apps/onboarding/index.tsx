import React from 'react';
import { connect } from 'react-redux';
import { Text } from 'react-native';
import { State } from '@suite/types';

const Index = () => {
    return (
        <>
            <Text>ONBOARDING</Text>
        </>
    );
};

const mapStateToProps = (state: State) => ({
    suite: state.suite,
});

export default connect(mapStateToProps)(Index);
