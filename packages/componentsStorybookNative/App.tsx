/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import styled from 'styled-components/native';
import Typography from './src/views/Typography';
import Form from './src/views/Form';
import Notification from './src/views/Notification';

const Container = styled.ScrollView.attrs({
	contentContainerStyle: {
		justifyContent: 'center',
		paddingTop: 50,
	}
})``;

type Props = {};
export default class App extends Component<Props> {
	render() {
		const options: any = {
			Typography: Typography,
			Form: Form,
			Notification: Notification,
		};

		return (
			<Container>
				<options.Notification />
			</Container>
		);
	}
}
