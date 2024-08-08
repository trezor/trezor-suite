# Master Deeplink Example

## Resources

-   https://reactnavigation.org/docs/deep-linking/#setup-with-expo-projects

## Dev tips

-   Use `uri-scheme` to trigger deeplinks in the app form terminal

```bash
npx uri-scheme open exp://192.168.87.157:8081/--/connect?somedata=blablameow\&test=ahoj --android
```

-   Or use `adb`:

```bash
adb shell am start -a android.intent.action.VIEW -d "exp://192.168.87.157:8081/--/connect?userId=123\&token=abc123\&redirectUrl=https://example.com"
```

-   Or something more complex with Trezor connect data:
    Enconding the object below:

```json
{
    "coin": "btc",
    "inputs": [
        {
            "address_n": [2147483692, 2147483648, 2147483648, 0, 5],
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
```

And method `signTransaction`, the command would be:

```
adb shell am start -a android.intent.action.VIEW -d "exp://192.168.171.157:8081/--/connect?userId=123\&token=abc123\&redirectUrl=https://example.com\&method=signTransaction\&payload=%7B%22coin%22%3A%22btc%22%2C%22inputs%22%3A%5B%7B%22address_n%22%3A%5B2147483692%2C2147483648%2C2147483648%2C0%2C5%5D%2C%22prev_hash%22%3A%2250f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d%22%2C%22prev_index%22%3A1%7D%5D%2C%22outputs%22%3A%5B%7B%22address%22%3A%22bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3%22%2C%22amount%22%3A%2210000%22%2C%22script_type%22%3A%22PAYTOADDRESS%22%7D%5D%2C%22chunkify%22%3Afalse%7D"
```

## Testing with custom scheme

-   https://reactnavigation.org/docs/deep-linking/#testing-deep-links

If you want to test with your custom scheme in your Expo app, you will need rebuild your standalone app by running `expo build:ios -t simulator` or `expo build:android` and install the resulting binaries.

## Findings

1. I have not found limits in the data that can be passed as query param.
2. In order to receive the client app should be also able to receive DeepLinks so callback deeplink can be passed in the initial call.
    - 3rd party integrator deeplink like trezor-suite://trezor-connect?method=signTx&amount=3000&callback=connect-client://trezor-suite?signedTx=xxx
