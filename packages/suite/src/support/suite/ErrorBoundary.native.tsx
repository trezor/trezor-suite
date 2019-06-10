import React from 'react';

import { View, Text } from 'react-native';

import { Sentry } from 'react-native-sentry';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error });
    }

    render() {
        if (this.state.error) {
            // render fallback UI
            return (
                <View>
                    <Text>Error occured</Text>
                </View>
            );
        }
        // when there's not an error, render children untouched
        return this.props.children;
    }
}

export default ErrorBoundary;
