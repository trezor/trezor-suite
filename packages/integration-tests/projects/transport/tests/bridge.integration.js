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

    afterEach(() => {
        controller.disconnect();
    });

    test('enumerate - acquire - getFeatures', async () => {
        BridgeV2.setFetch(fetch, true);

        const bridge = new BridgeV2(null, null);
        await bridge.init(false);
        await bridge.configure(messages);

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

        const session = await bridge.acquire({ path: devices[0].path });

        const message = await bridge.call(session, 'GetFeatures', {});

        expect(message).toMatchObject({
            type: 'Features',
            message: {
                vendor: 'trezor.io',
                label: 'TrezorT',
            },
        });
    });
});
