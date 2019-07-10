/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import styled from 'styled-components/native';
import Typography from './src/views/Typography';
import Form from './src/views/Form';
import Notification from './src/views/Notification';
import Buttons from './src/views/Button';
import Other from './src/views/Other';

const Container = styled.ScrollView.attrs({
    contentContainerStyle: {
        justifyContent: 'center',
        paddingTop: 50,
    },
})``;

export const App = () => {
    const options: any = {
        Typography,
        Form,
        Notification,
        Buttons,
        Other,
    };

    return (
        <Container>
            <options.Other />
        </Container>
    );
};
