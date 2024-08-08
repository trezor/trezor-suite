import { Text, View, StyleSheet, Button } from 'react-native';
import * as Linking from 'expo-linking';

/**
{
  "coin": "btc",
  "inputs": [
    {
      "address_n": [
        2147483692,
        2147483648,
        2147483648,
        0,
        5
      ],
      "prev_hash": "50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d",
      "prev_index": 1
    }
  ],
  "outputs": [
    {
      "address": "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3",
      "amount": "10000",
      "script_type": "PAYTOADDRESS"
    }
  ],
  "chunkify": false
}
 */

export const ClientHomeScreen = ({ data }: any) => {
    const handleButtonPress = () => {
        const amount = 3000; // Example amount
        const signedTx = 'xxx'; // Replace with actual signed transaction
        // const deepLink = `trezor-suite://trezor-connect?method=signTx&amount=${amount}&callback=connect-client://trezor-suite?signedTx=${signedTx}`;
        // const deepLink = `exp://192.168.0.205:8081/settings?method=signTx&amount=${amount}&callback=exp://192.168.0.205:8081/settings?signedTx=${signedTx}`;
        const deepLink = `exp://192.168.171.157:8081/--/connect?callbackDeeplink=exp%3A%2F%2F192.168.171.157:8085/--/client\&method=signTransaction\&payload=%7B%22coin%22%3A%22btc%22%2C%22inputs%22%3A%5B%7B%22address_n%22%3A%5B2147483692%2C2147483648%2C2147483648%2C0%2C5%5D%2C%22prev_hash%22%3A%2250f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d%22%2C%22prev_index%22%3A1%7D%5D%2C%22outputs%22%3A%5B%7B%22address%22%3A%22bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3%22%2C%22amount%22%3A%2210000%22%2C%22script_type%22%3A%22PAYTOADDRESS%22%7D%5D%2C%22chunkify%22%3Afalse%7D`;
        console.log('deepLink', deepLink);
        Linking.openURL(deepLink).catch(err => console.error('An error occurred', err));
    };

    return (
        <View style={styles.container}>
            <Text>Client Home Screen</Text>
            {data && <Text>Received Data: {JSON.stringify(data)}</Text>}
            <Button title="Sign Transaction" onPress={handleButtonPress} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
});
