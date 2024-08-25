import { UsbApi } from '@trezor/transport/src/api/usb';

import { buildMessage, assertMessage, assertSuccess, assertEquals } from './utils';
import { sharedTest, success, info, debug, error } from './shared';

/**
 * create api for both node and browser and return it
 */
const setupApisUnderTest = async () => {
    let usbInterface: ConstructorParameters<typeof UsbApi>[0]['usbInterface'];

    if (typeof window !== 'undefined') {
        window.Buffer = (await import('buffer')).Buffer;
        usbInterface = window?.navigator?.usb;
    } else {
        usbInterface = await import('usb').then(lib => {
            return new lib.WebUSB({ allowAllDevices: true });
        });
    }

    type ApiTestFixture = {
        initArgs: ConstructorParameters<typeof UsbApi>[0];
        description: string;
    };
    const apiTestFixture: ApiTestFixture[] = [];
    if (typeof window !== 'undefined') {
        apiTestFixture.push({ initArgs: { usbInterface }, description: 'browser' });
    } else {
        apiTestFixture.push(
            {
                initArgs: { usbInterface, forceReadSerialOnConnect: true },
                description: 'node, forceReadSerialOnConnect: true',
            },
            {
                initArgs: { usbInterface, forceReadSerialOnConnect: false },
                description: 'node, forceReadSerialOnConnect: false',
            },
        );
    }

    return apiTestFixture.map(f => {
        return { api: new UsbApi(f.initArgs), description: f.description };
    });
};

const runTests = async () => {
    const fixtures = await setupApisUnderTest();

    for (const f of fixtures) {
        info(`Running tests for ${f.description}`);

        const { api } = f;
        let path: string;

        const getConnectedDevicePath = async () => {
            info('getConnectedDevicePath...');
            const res = await api.enumerate();
            debug('getConnectedDevicePath: discovered devices', res);

            assertSuccess(res);
            if (res.payload.length !== 1) {
                throw new Error(error('Expected exactly one device to be connected'));
            }
            debug('getConnectedDevicePath: path set to: ', res.payload[0].path);
            path = res.payload[0].path;
        };

        const pingPong = async () => {
            await api.openDevice(path, true);
            const writeResponse = await api.write(path, buildMessage('PING'));
            debug('writeResponse', writeResponse);
            assertSuccess(writeResponse);

            const readResponse = await api.read(path);

            debug('readResponse', readResponse);
            assertSuccess(readResponse);
            debug('readResponse', readResponse.payload.toString('hex'));
            assertMessage(readResponse.payload, 'SUCCESS');
            await api.closeDevice(path);
        };

        const concurrentEnumerate = async (concurrent: number) => {
            const res = await Promise.all(
                new Array(concurrent).fill(undefined).map(() => api.enumerate()),
            );
            res.forEach((r, index) => {
                assertSuccess(r);
                assertSuccess(res[0]);
                if (index > 0) {
                    assertEquals(r.payload, res[0].payload);
                }
            });
        };

        // interestingly, in node, concurrent enumeration does not work if triggered as the first interaction with connected device.
        // concurrent enumeration triggered couple of lines below works correctly
        await sharedTest('concurrent enumerate - as the first operation', () =>
            // todo: 3 doesn't work in node!!! FIX
            concurrentEnumerate(typeof window === 'undefined' ? 3 : 1),
        );
        await getConnectedDevicePath();

        // here concurrent enumeration works correctly, even in node.
        await sharedTest('concurrent enumerate', () => concurrentEnumerate(3));
        await sharedTest('ping pong', pingPong);

        await sharedTest('read-abort-write', async () => {
            debug('open device');
            await api.openDevice(path, true);

            const abortController = new AbortController();
            debug('read with abort signal');
            const readPromise = api.read(path, abortController.signal);
            debug('trigger abort');
            abortController.abort();
            await readPromise;
            debug('write PING');
            await api.write(path, buildMessage('PING'));
            debug('read and expect SUCCESS');
            const readResponse = await api.read(path);
            assertSuccess(readResponse);
            assertMessage(readResponse.payload, 'SUCCESS');
            await api.closeDevice(path);
            debug('device closed');
        });
    }
    success('All tests passed');
};

runTests();
