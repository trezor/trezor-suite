import { Text, View, StyleSheet } from 'react-native';

export const HomeScreen = ({ data }: any) => {
    return (
        <View style={styles.container}>
            <Text>Trezor Suite</Text>
            {data && <Text>Received Data: {JSON.stringify(data)}</Text>}
        </View>
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
