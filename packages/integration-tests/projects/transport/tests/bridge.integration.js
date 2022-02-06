const fetch = require('node-fetch').default;

// testing build. yarn workspace @trezor/transport build:lib is a required step therefore
const TrezorLink = require('../../../../transport/lib').default;

// messages are generated by docker/docker-transport-test.sh
const messages = require('../messages.json');

const { wait, setup, Controller } = global.Trezor;

const { BridgeV2 } = TrezorLink;

const controller = new Controller({
    url: 'ws://localhost:9001/',
});

jest.setTimeout(30000);

describe('bridge', () => {
    beforeEach(async () => {
        await setup(controller);

        await wait(1000);
    });

    afterAll(() => {
        controller.disconnect();
    });

    // there might be more versions of bridge out there, see https://github.com/trezor/webwallet-data/tree/master/bridge
    // but they are not available from trezor-user-env, see https://github.com/trezor/trezor-user-env/tree/master/src/binaries/trezord-go/bin
    ['2.0.26', '2.0.27', undefined].forEach(bridgeVersion => {
        test(`${bridgeVersion || 'latest'}: enumerate - acquire - getFeatures`, async () => {
            // note: sending undefined should run the latest version
            await controller.send({ type: 'bridge-start', version: bridgeVersion });

            BridgeV2.setFetch(fetch, true);

            const bridge = new BridgeV2(null, null);
            await bridge.init(false);
            bridge.configure(messages);

            const devices = await bridge.enumerate();

            expect(devices).toEqual([
                {
                    path: '1',
                    session: null,
                    debugSession: null,
                    product: 0,
                    vendor: 0,
                    debug: true,
                },
            ]);

            const session = await bridge.acquire({ path: devices[0].path }, false);

            const message = await bridge.call(session, 'GetFeatures', {}, false);

            expect(message).toMatchObject({
                type: 'Features',
                message: {
                    vendor: 'trezor.io',
                    label: 'TrezorT',
                },
            });
        });
    });
});
