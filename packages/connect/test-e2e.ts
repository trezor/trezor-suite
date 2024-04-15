/* eslint-disable no-console */
import path from 'path';

import * as messages from '@trezor/protobuf/messages.json';
// import { v2 as protocolV2, thp } from '@trezor/protocol';
import { BluetoothTransport, TrezorBluetooth } from '@trezor/transport-bluetooth/src';

import TrezorConnect, { Device } from './src';
import { NodeUsbTransport, UdpTransport } from '../transport/src';

// eslint-disable-next-line import/no-extraneous-dependencies, import/order
const argv = require('minimist')(process.argv.slice(2));

const debugTransport =
    argv._.includes('udp') || argv.udp
        ? new UdpTransport({ id: 'udp', messages, debugLink: true })
        : new NodeUsbTransport({ id: 'usb', messages, debugLink: true });

const initDebugLink = async () => {
    await debugTransport.init();

    const enumerate = await debugTransport.enumerate();
    if (!enumerate.success) {
        return;
    }
};

const waitForDebugDevice = async () => {
    let device;
    let attempt = 0;
    while (!device && attempt < 10) {
        const enumerate = await debugTransport.enumerate();
        console.log('DebugLink enumerate', enumerate);
        if (!enumerate.success) {
            throw new Error(enumerate.error);
        }
        if (enumerate.payload.length > 0) {
            device = enumerate.payload[0];
        }
        attempt++;
    }

    return device;
};

export const debugLinkState = async (uiEvent: any) => {
    const descriptor = await waitForDebugDevice();

    if (!descriptor) {
        throw new Error('Debug device not found');
    }
    const input = { ...descriptor, previous: descriptor.session };

    const acquire = await debugTransport.acquire({ input });
    if (!acquire.success) {
        throw new Error(acquire.error);
    }

    const { channel } = uiEvent.device.thp;
    // const highBytes = Buffer.from(channel, 'hex').readUInt16LE();
    // const value = highBytes << 16; // shift the highBytes by 16 bits to form a uint32

    let nfc_secret_host, handshake_hash;
    if (uiEvent.nfcData) {
        const nfcData = Buffer.from(uiEvent.nfcData, 'hex');
        nfc_secret_host = nfcData.subarray(0, 16);
        handshake_hash = nfcData.subarray(16);
    }

    const session = acquire.payload;
    const response = await debugTransport.call({
        name: 'DebugLinkGetPairingInfo',
        data: {
            channel_id: Buffer.from(channel, 'hex'),
            handshake_hash,
            nfc_secret_host,
        },
        session,
    });

    console.warn('DebugLinkState', response);

    await debugTransport.release({ ...descriptor, session });
    await debugTransport.enumerate();

    return response;
};

const debugLinkDecision = async () => {
    if (!argv['interaction']) return; // TODO: not working after some rebase

    console.warn('debugLinkDecision-1');
    const enumerate = await debugTransport.enumerate();
    // disable auto click
    // if (enumerate) return;
    if (!enumerate.success) {
        throw new Error(enumerate.error);
    }

    const acquire = await debugTransport.acquire({ input: enumerate.payload[0] as any });
    if (!acquire.success) {
        throw new Error(acquire.error);
    }

    const session = acquire.payload;
    const callRes = await debugTransport
        .send({
            name: 'DebugLinkDecision',
            data: { button: 1 },
            session,
        })
        .then(r => {
            console.warn('debugLinkDecision-4', r);

            return r;
        });

    console.warn('debugLinkDecision-5', callRes);

    const release = await debugTransport.release({ ...enumerate.payload[0], session });
    console.warn('debugLinkDecision-6', release);
    const enum2 = await debugTransport.enumerate();

    console.warn('debugLinkDecision-end', enum2);
};

const readline = require('readline');
function waitForInput(promptText = 'Enter input: ') {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        rl.question(promptText, (answer: any) => {
            rl.close();
            resolve(answer);
        });
    });
}

const getFeatures = (device: Device) =>
    TrezorConnect.getFeatures({
        device,
    });

const fwUpdate = (device: Device) =>
    TrezorConnect.firmwareUpdate({
        device,
        baseUrl: path.resolve(__dirname, '../connect-common/files'),
    });

const signTx = (device: Device) => {
    const inputs = [];
    for (let i = 0; i < 10; i++) {
        inputs.push({
            address_n: `m/44'/1'/1'/0/${i}`,
            prev_hash: '3019487f064329247daad245aed7a75349d09c14b1d24f170947690e030f5b20',
            prev_index: i,
            amount: 14598,
        });
    }

    const outputs = [];
    for (let i = 0; i < 4; i++) {
        const output = {
            address: 'momtnzR3XqXgDSsFmd8gkGxUiHZLde3RmA',
            amount: 7129,
            script_type: 'PAYTOADDRESS',
        };

        outputs.push(output);
    }

    return TrezorConnect.signTransaction({
        device,
        coin: 'Testnet',
        inputs,
        outputs: [
            {
                address: 'mnY26FLTzfC94mDoUcyDJh1GVE3LuAUMbs',
                amount: 10 * 14_598 - 60_000,
            },
        ],
    });
};

const signMessage = (device: Device) =>
    TrezorConnect.signMessage({
        device,
        coin: 'Testnet',
        path: "m/44'/1'/0'/0/0",
        message: 'Lorem ipsum '.repeat(100),
    });

const runTestCase = async (device: Device) => {
    const testCase = argv.t || argv.test;
    if (testCase === 'none') {
        console.log('missing test. exiting...');
        process.exit(1);
    }

    // device is ready, start the test
    let result;
    if (testCase === 'passphrase') {
        const expectedState: `${string}@${string}` = `mnXjX3NZFbrN6FsKX6vVE8rSkmMAt5UoqQ@${device.id}`;
        result = await TrezorConnect.getAddress({
            device: {
                ...device,
                state: {
                    sessionId: '1', // does not exist, should throw Failure_InvalidSession
                    staticSessionId: `${expectedState}:0`,
                },
            },
            path: "m/44'/0'/0'/0/0",
        });
        if (!result.success) {
            throw new Error(result.payload.error);
        }

        result = await TrezorConnect.getAddress({
            device: {
                ...device,
                instance: 1,
                state: {
                    sessionId: result.device?.state?.sessionId, //recycle previous
                    staticSessionId: `${expectedState}:1`,
                },
            },
            path: "m/44'/0'/0'/0/0",
        });
    } else if (testCase === 'sign') {
        result = await signTx(device);
    } else if (testCase === 'signmsg') {
        result = await signMessage(device);
    } else if (testCase === 'fwupdate') {
        result = await fwUpdate(device);
    } else if (testCase === 'wipe') {
        result = await TrezorConnect.wipeDevice({ device });
    } else if (testCase === 'homescreen') {
        const buff = require('fs').readFileSync(
            // '../trezor-firmware/tests/device_tests/test_bg_eckhart.jpg',
            path.resolve(
                __dirname,
                '../suite-data/files/images/homescreens/COLOR_520x380/orange_t3w1.jpg',
            ),
        );

        result = await TrezorConnect.applySettings({
            device,
            homescreen: buff.toString('hex'),
            // display_rotation: 'West',
        });
    } else if (testCase === 'get-credentials') {
        result = await TrezorConnect.thpGetCredentials({ device });
    } else if (testCase === 'remove-credentials') {
        result = await TrezorConnect.thpRemoveCredentials({
            device,
            // credentials: [device.thp?.credentials[0]],
        });
        result = await TrezorConnect.getFeatures({ device });
        // TrezorConnect.removeAllListeners('DEVICE_EVENT');
        // await new Promise(resolve => {
        //     TrezorConnect.on('device-disconnect', resolve);
        // });
    } else {
        result = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/0/0",
        });
    }

    console.warn(result);
    process.exit(1);
};

let testIsRunning = false;
const run = async () => {
    await initDebugLink();

    const bluetoothApi = new TrezorBluetooth({ url: `ws://localhost:21327/` });
    if (argv.bluetooth) {
        await bluetoothApi.connect();
    }

    // const testStart = Date.now();
    TrezorConnect.on('DEVICE_EVENT', async event => {
        // console.warn('DEVICE_EVENT', event);
        if (event.type === 'device-connect_unacquired' || event.type === 'device-connect') {
            if (testIsRunning) {
                return;
            }

            const device = event.payload;
            if (device.features && device.mode === 'initialize') {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await TrezorConnect.loadDevice({
                    device,
                    pin: '',
                    label: 'THP device',
                    passphrase_protection: true,
                    mnemonics: ['all all all all all all all all all all all all'],
                    skip_checksum: true,
                });
            }

            if (!device.features && device.thp?.properties) {
                // start pairing
                const result = await getFeatures(device);
                if (!result.success) {
                    console.warn(result);
                    process.exit(1);
                }
            } else {
                testIsRunning = true;
                runTestCase(device);
            }
        }

        if (event.type === 'device-thp_credentials_changed') {
            console.log('----> CREDENTIALS', event.payload);
        }

        // if (event.type === 'device-changed') {
        //     console.warn(event.payload);
        // }
    });

    const ignoreUiEvent = ['ui-device_firmware_outdated', 'ui-device_needs_backup'];

    TrezorConnect.on('UI_EVENT', async event => {
        if (ignoreUiEvent.includes(event.type)) {
            return;
        }
        console.warn('UI_EVENT', event);

        if (event.type === 'ui-firmware_disconnect') {
            const { id } = event.payload.device.bluetoothProps!;
            bluetoothApi.send('disconnect_device', id).then(() => {
                bluetoothApi.send('connect_device', { id, timeout: 50000 });
            });
        }

        if (event.type === 'ui-request_pin') {
            setTimeout(() => TrezorConnect.cancel(), 1000);

            // TrezorConnect.uiResponse({
            //     type: 'ui-receive_pin',
            //     payload: null,
            // });
        }

        if (event.type === 'ui-request_confirmation') {
            return TrezorConnect.uiResponse({
                type: 'ui-receive_confirmation',
                payload: true,
            });
        }

        if (event.type === 'ui-button') {
            const name = event.payload?.name;
            if (argv.pairing === 'cancel-pairing' && name === 'thp_pairing_request') {
                return setTimeout(() => TrezorConnect.cancel(), 2000);
            }

            if (argv.pairing === 'cancel-pairing' && name === 'thp_connection_request') {
                return setTimeout(() => TrezorConnect.cancel(), 2000);
            }

            if (
                argv.pairing === 'cancel-autoconnect' &&
                name === 'thp_autoconnect_credential_request'
            ) {
                return setTimeout(() => TrezorConnect.cancel(), 2000);
            }
        }

        if (event.type === 'ui-request_passphrase') {
            if (argv['cancel-passphrase']) {
                return TrezorConnect.cancel();
            }
            if (argv['cancel-passphrase-ui']) {
                // respond with no passphrase
                // @ts-expect-error
                return TrezorConnect.uiResponse({
                    type: 'ui-receive_passphrase',
                });
            }

            const value = argv['passphrase'] || '';
            TrezorConnect.uiResponse({
                type: 'ui-receive_passphrase',
                payload: { value, passphraseOnDevice: argv['passphrase-on-device'] },
            });
        }

        if (event.type === 'ui-request_thp_pairing') {
            if (argv.pairing === 'stop') {
                return;
            }
            if (argv.pairing === 'cancel') {
                return TrezorConnect.cancel();
            }
            if (argv.pairing === 'ui-cancel') {
                // @ts-expect-error
                return TrezorConnect.uiResponse({
                    type: 'ui-receive_thp_pairing_tag',
                    // no payload will reject as cancel
                });
            }
            if (argv.pairing === 'ui-wrong') {
                return TrezorConnect.uiResponse({
                    type: 'ui-receive_thp_pairing_tag',
                    payload: { source: 'code-entry', tag: '000000' },
                });
            }

            // const state = await debugLinkState(event.payload);
            // if (!state?.success) {
            //     throw new Error('DebugLinkState missing: ' + state.error);
            // }
            // if (state.payload.type !== 'DebugLinkPairingInfo') {
            //     throw new Error('DebugLinkState missing, received ' + state.payload.type);
            // }

            // const { code_entry_code, code_qr_code, nfc_secret_trezor } = state.payload.message;

            const tag = await waitForInput();

            let response: any;
            if (event.payload.selectedMethod === 3) {
                response = {
                    source: 'qr-code',
                    tag,
                    // tag: code_qr_code,
                };
            } else if (event.payload.selectedMethod === 4) {
                response = {
                    source: 'nfc',
                    tag,
                    // tag: nfc_secret_trezor,
                };
            } else if (event.payload.selectedMethod === 2) {
                response = {
                    source: 'code-entry',
                    tag,
                    // tag: code_entry_code?.toString(),
                };
            }

            if (!response) {
                throw new Error(`selectedMethod: ${event.payload.selectedMethod} not recognized`);
            }

            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: response,
            });
        }

        if (event.type === 'ui-button') {
            // console.warn('RESOLVE!');
            // TrezorConnect.cancel();
            await debugLinkDecision();
        }
    });

    let transport: any = 'NodeUsbTransport';
    if (argv._.includes('udp')) {
        transport = 'UdpTransport';
    } else if (argv._.includes('bridge')) {
        transport = 'BridgeTransport';
    }

    let pairingMethods: any[] = ['CodeEntry', 'QrCode', 'NFC', 'SkipPairing'];
    if (argv.pairing === 'none') {
        pairingMethods = ['SkipPairing'].concat(pairingMethods.filter(m => m === 'SkipPairing'));
    }
    if (argv.pairing === 'qr') {
        pairingMethods = ['QrCode'].concat(pairingMethods.filter(m => m === 'QrCode'));
    }
    if (argv.pairing === 'nfc') {
        pairingMethods = ['NFC'].concat(pairingMethods.filter(m => m === 'NFC'));
    }

    let knownCredentials: any = [];
    if (argv.credentials) {
        knownCredentials = [
            // Trezor
            {
                trezor_static_public_key:
                    'e0f016c54241fbde279003c2065cc012aac28d22dd396bbf5d93c4a60add6969',
                credential:
                    '0a110a0d5472657a6f72436f6e6e65637410001220d36160bf4ca7bad0c4c13ce99969e4862bff4c59711ffbf9c75ee60fae0a9e54',
                autoconnect: false,
            },
            // Emulator
            {
                trezor_static_public_key:
                    'f60b84cdb80a2139f80489c811dc129937a4f4f75ca7710c7570c5085f1ffe68',
                credential:
                    '0a110a0d5472657a6f72436f6e6e656374100012208d1f5837fb830a684bb66d9283617f9280d4d8e3ee2926180a68f3b8ddefbc4a',
            },
        ];
    }
    if (argv.autoconnect) {
        knownCredentials = [
            // Trezor
            {
                trezor_static_public_key:
                    '592bcfefbf5b20eaaf008343300183a10cce308fe9a35960c4fb215de6fe6e00',
                credential:
                    '0a110a0d5472657a6f72436f6e6e65637410011220bd581a1429fba56b9ae7e323ffff1ef20ba7b97fe0c82b294fa3888126b60659',
                autoconnect: true,
            },
            // Emulator
            {
                trezor_static_public_key:
                    'f60b84cdb80a2139f80489c811dc129937a4f4f75ca7710c7570c5085f1ffe68',
                credential:
                    '0a110a0d5472657a6f72436f6e6e656374100112204de03957fd816261cb8fbfd99827f08c51cfc3e984d8fa3f1894093eeec92a15',
                autoconnect: true,
            },
        ];
    }

    if (argv.bluetooth) {
        const enumerate = await bluetoothApi.send('start_scan');
        const btDevice = enumerate.find(d => d.paired);
        if (!btDevice) {
            throw new Error('BT Device is missing');
        }

        await bluetoothApi.send('connect_device', { id: btDevice.id, timeout: 5000 });

        await bluetoothApi.send('start_scan');

        transport = new BluetoothTransport({ url: 'ws://127.0.0.1:21327', messages, id: 'ble' });
    }

    await TrezorConnect.init({
        manifest: { appUrl: 'a', appName: 'TrezorConnect', email: 'b' },
        transports: [transport],
        pendingTransportEvent: false,
        // lazyLoad: true,
        debug: true,
        thp: {
            hostName: 'TrezorConnect',
            staticKey: '0007070707070707070707070707070707070707070707070707070707070747',
            knownCredentials,
            pairingMethods,
        },
    });
};

run();
