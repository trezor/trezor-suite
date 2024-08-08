import { Text, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ClientHomeScreen } from './screens/ClientHomeScreen';

const prefix = Linking.createURL('/');
const Stack = createNativeStackNavigator();

export default function RootLayout() {
    console.log('RootLayout in client-deeplink-example');
    const [data, setData] = useState<any>(null);
    const url = Linking.useURL();

    const linking = {
        prefixes: [prefix],
        config: {
            screens: {
                Home: 'client',
            },
        },
    };

    const getInitialUR = async () => {
        const initialURL = await Linking.getInitialURL();
        console.log('initialURL', initialURL);
        if (initialURL) {
            setData(Linking.parse(initialURL));
        }
    };

    const handleDeepLink = event => {
        console.log('handleDeepLink');
        console.log('event', event);
        let data = Linking.parse(event.url);
        console.log('data', data);
        setData(data);
    };

    useEffect(() => {
        Linking.addEventListener('url', handleDeepLink);
        // getInitialUR(); // Call to get the initial URL
        return () => {
            // Linking.removeEventListener('url', handleDeepLink);
        };
    }, []);

    return (
        <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
            <Stack.Navigator>
                <Stack.Screen name="Home" options={{ title: 'Home' }}>
                    {props => <ClientHomeScreen {...props} data={data} />}
                </Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
});
