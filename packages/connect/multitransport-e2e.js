import TrezorConnect from './src';

const run = async () => {
    TrezorConnect.on('DEVICE_EVENT', device => {
        console.warn('DEVICE_EVENT', device);
    });
    TrezorConnect.on('TRANSPORT_EVENT', event => {
        console.warn('TRANSPORT_EVENT', event);
    });

    const initResult = await TrezorConnect.init({
        manifest: { appUrl: 'a', email: 'b' },
        transports: ['UdpTransport', 'UdpTransport'],
        pendingTransportEvent: true,
        // debug: true,
    });

    console.warn('all inited!', initResult);

    // TrezorConnect.getAddress({ path: "m/44'/0'/0'/0/0" }).then(console.warn);
};

run();
