/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import styled from 'styled-components/native';
import Components from './src';

const Container = styled.ScrollView.attrs({
    contentContainerStyle: {
        justifyContent: 'center',
        paddingTop: 50,
    },
})``;

const App = () => (
    <Container>
        <Components />
    </Container>
);

export default App;
