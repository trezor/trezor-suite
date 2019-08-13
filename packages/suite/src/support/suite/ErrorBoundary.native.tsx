import React from 'react';
import { Text, View } from 'react-native';
// import { Sentry } from 'react-native-sentry';

interface Props {
    children: React.ReactNode;
}

interface State {
    error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    state = { error: null };

    componentDidCatch(error: Error, _info: object) {
        this.setState({ error });
        // Alert.alert(
        //     'error',
        //     'An unexpected error has occurred. Please restart the app to continue.',
        //     [
        //         {
        //             text: 'cta',
        //             onPress: () => {},
        //         },
        //     ],
        //     { cancelable: false },
        // );
    }

    render() {
        return this.state.error ? (
            <>
                <View>
                    <Text>Error occured</Text>
                </View>
            </>
        ) : (
            this.props.children
        );
    }
}

export default ErrorBoundary;
