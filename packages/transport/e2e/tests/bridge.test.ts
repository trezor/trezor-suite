import fetch from 'node-fetch';

// testing build. yarn workspace @trezor/transport build:lib is a required step therefore
import TrezorLink from '../../lib';
import messages from '../../messages.json';

// import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { Controller } from '@trezor/trezor-user-env-link';

const { BridgeV2 } = TrezorLink;

jest.setTimeout(30000);

const mnemonicAll = 'all all all all all all all all all all all all';

const emulatorSetupOpts = {
    mnemonic: mnemonicAll,
    pin: '',
    passphrase_protection: false,
    label: 'TrezorT',
    needs_backup: true,
};

const emulatorStartOpts = { version: '2-master', wipe: true };

describe('bridge', () => {
    beforeAll(async () => {
        await Controller.connect();
    });

    afterAll(() => {
        Controller.disconnect();
    });

    // there might be more versions of bridge out there, see https://github.com/trezor/webwallet-data/tree/master/bridge
    // but they are not available from trezor-user-env, see https://github.com/trezor/trezor-user-env/tree/master/src/binaries/trezord-go/bin
    ['2.0.26', '2.0.27', undefined].forEach(bridgeVersion => {
        describe(bridgeVersion || 'latest', () => {
            let bridge: any;
            let devices: any[];
            let session: any;
            beforeEach(async () => {
                await Controller.send({ type: 'bridge-stop' });
                await Controller.send({ type: 'emulator-start', ...emulatorStartOpts });
                await Controller.send({ type: 'emulator-setup', ...emulatorSetupOpts });
                await Controller.send({ type: 'bridge-start', version: bridgeVersion });

                BridgeV2.setFetch(fetch, true);

                bridge = new BridgeV2(undefined, undefined);

                // this is how @trezor/connect is using it at the moment
                // bridge.setBridgeLatestVersion(bridgeVersion);

                await bridge.init(false);
                bridge.configure(messages);

                devices = await bridge.enumerate();

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

                session = await bridge.acquire({ path: devices[0].path }, false);
            });

            test(`Call(GetFeatures)`, async () => {
                const message = await bridge.call(session, 'GetFeatures', {}, false);
                expect(message).toMatchObject({
                    type: 'Features',
                    message: {
                        vendor: 'trezor.io',
                        label: 'TrezorT',
                    },
                });
            });

            test(`post(GetFeatures) - read`, async () => {
                const postResponse = await bridge.post(session, 'GetFeatures', {}, false);
                expect(postResponse).toEqual(undefined);

                const readResponse = await bridge.read(session, false);
                expect(readResponse).toMatchObject({
                    type: 'Features',
                    message: {
                        vendor: 'trezor.io',
                        label: 'TrezorT',
                    },
                });
            });

            test(`call(ChangePin) - post(Cancel) - read`, async () => {
                // initiate change pin procedure on device
                const callResponse = await bridge.call(session, 'ChangePin', {}, false);
                expect(callResponse).toMatchObject({
                    type: 'ButtonRequest',
                });

                // cancel change pin procedure
                const postResponse = await bridge.post(session, 'Cancel', {}, false);
                expect(postResponse).toEqual(undefined);

                // read response
                const readResponse = await bridge.read(session, false);
                expect(readResponse).toMatchObject({
                    type: 'Failure',
                    message: {
                        code: 'Failure_ActionCancelled',
                        message: 'Cancelled',
                    },
                });

                // validate that we can continue with communication
                const message = await bridge.call(session, 'GetFeatures', {}, false);
                expect(message).toMatchObject({
                    type: 'Features',
                    message: {
                        vendor: 'trezor.io',
                        label: 'TrezorT',
                    },
                });
            });

            test(`call(Backup) - post(Cancel) - read`, async () => {
                // initiate change pin procedure on device
                const callResponse = await bridge.call(session, 'BackupDevice', {}, false);
                expect(callResponse).toMatchObject({
                    type: 'ButtonRequest',
                });

                // cancel change pin procedure
                const postResponse = await bridge.post(session, 'Cancel', {}, false);
                expect(postResponse).toEqual(undefined);

                // read response
                const readResponse = await bridge.read(session, false);
                expect(readResponse).toMatchObject({
                    type: 'Failure',
                    message: {
                        code: 'Failure_ActionCancelled',
                        message: 'Cancelled',
                    },
                });

                // validate that we can continue with communication
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
});
