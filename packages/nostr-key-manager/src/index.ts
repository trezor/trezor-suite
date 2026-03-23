import TrezorConnect, { DEVICE_EVENT, TRANSPORT_EVENT } from '@trezor/connect';

const run = async () => {
    await TrezorConnect.init({
        manifest: {
            appUrl: 'my app',
            appName: 'Trezor Connect Example',
            email: 'app@myapp.meow',
        },
        transports: ['NodeUsbTransport', 'UdpTransport'],
    });

    // this event will be fired when bridge starts or stops or there is no bridge running
    TrezorConnect.on(TRANSPORT_EVENT, event => {
        // eslint-disable-next-line
        console.log(event);
    });

    // this event will be fired when device connects, disconnects or changes
    TrezorConnect.on(DEVICE_EVENT, event => {
        // eslint-disable-next-line
        console.log(event);
    });

    const result = await TrezorConnect.nostrGetPublicKey({ path: "m/44'/1237'/0'/0/0", device: { useEmptyPassphrase: true } });

    // eslint-disable-next-line
    console.log(result);

    const signResult = await TrezorConnect.nostrSignEvent({
            path: "m/44'/1237'/0'/0/0",
            created_at: Math.floor(Date.now() / 1000),
            kind: 1,
            tags: [],
            content: 'Hello Nostr!',
        });

    console.log('signResult', signResult);

    if (!result.success) {
        process.exit(1);
    } else {
        process.exit(0);
    }
};

run();
