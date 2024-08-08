function createUrl(
    baseUrl: string,
    callbackDeeplink: string,
    method: string,
    payload: object,
): string {
    const encodePayload = (obj: object): string => {
        return encodeURIComponent(JSON.stringify(obj));
    };

    const payloadString = encodePayload(payload);

    const finalUrl = `${baseUrl}?callbackDeeplink=${encodeURIComponent(callbackDeeplink)}\\&method=${method}\\&payload=${payloadString}`;

    return finalUrl;
}

// Example usage
const baseUrl = 'exp://192.168.171.157:8081/--/connect';
const callbackDeeplink = 'exp://192.168.171.157:8085/client';
const method = 'signTransaction';
const payload = {
    coin: 'btc',
    inputs: [
        {
            address_n: [2147483692, 2147483648, 2147483648, 0, 5],
            prev_hash: '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
            prev_index: 1,
        },
    ],
    outputs: [
        {
            address: 'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3',
            amount: '10000',
            script_type: 'PAYTOADDRESS',
        },
    ],
    chunkify: false,
};

// Generate the final URL
const finalUrl = createUrl(baseUrl, callbackDeeplink, method, payload);
console.log(`adb shell am start -a android.intent.action.VIEW -d "${finalUrl}"`);
