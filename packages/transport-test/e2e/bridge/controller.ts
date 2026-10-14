/* eslint no-console: 0 */

import { usb } from 'usb-legacy';

import { Log } from '@trezor/logger';
import { protobufManager } from '@trezor/protobuf';
import * as bitcoinProto from '@trezor/protobuf/src/definitions/messages-bitcoin_pb';
import * as commonProto from '@trezor/protobuf/src/definitions/messages-common_pb';
import * as managementProto from '@trezor/protobuf/src/definitions/messages-management_pb';
import * as messagesProto from '@trezor/protobuf/src/definitions/messages_pb';
import { TrezordNode } from '@trezor/transport-bridge/src';
import { BridgeTransport, TREZOR_USB_DESCRIPTORS } from '@trezor/transport-common';
import { TrezorUserEnvLinkClass } from '@trezor/trezor-user-env-link';
import { scheduleAction } from '@trezor/utils';

export const env = {
    USE_HW: process.env.USE_HW === 'true',
};

console.log('env', env);

/**
 * Controller based on TrezorUserEnvLink its main purpose is:
 * - to bypass communication with trezor-user-env and allow using local hw devices
 * - start and stop node bridge (node bridge should be implemented into trezor-user-env however)
 */
class Controller extends TrezorUserEnvLinkClass {
    private logger: Console;
    private nodeBridge: TrezordNode | undefined = undefined;

    private originalApi: {
        connect: typeof TrezorUserEnvLinkClass.prototype.connect;
        startEmu: typeof TrezorUserEnvLinkClass.prototype.startEmu;
        stopEmu: typeof TrezorUserEnvLinkClass.prototype.stopEmu;
    };

    constructor() {
        super();

        this.logger = console;

        protobufManager.load([commonProto, messagesProto, managementProto, bitcoinProto]);

        this.originalApi = {
            connect: super.connect.bind(this),
            startEmu: super.startEmu.bind(this),
            stopEmu: super.stopEmu.bind(this),
        };

        this.connect = !env.USE_HW ? this.originalApi.connect : () => Promise.resolve(null);

        this.startBridge = async () => {
            this.nodeBridge = new TrezordNode({
                api: env.USE_HW ? 'legacy' : 'udp',
                logger: new Log('test-bridge', false),
            });

            await this.nodeBridge.start();

            // todo: this shouldn't be here, nodeBridge should be started when start resolves
            await this.waitForBridgeIsRunning(true);

            return null;
        };

        this.stopBridge = async () => {
            await this.nodeBridge?.stop();

            // todo: this shouldn't be here, nodeBridge should be stopped when stop resolves
            await this.waitForBridgeIsRunning(false);

            return null;
        };

        this.startEmu = !env.USE_HW
            ? this.originalApi.startEmu
            : () => this.waitForNumberOfDevices(1);

        this.stopEmu = !env.USE_HW
            ? this.originalApi.stopEmu
            : () => this.waitForNumberOfDevices(0);
    }

    private waitForNumberOfDevices = (expected: number) => {
        this.logger.log(
            `${env.USE_HW ? '[MANUAL ACTION REQUIRED] ' : ''} waiting for ${expected} device to be connected`,
        );

        return scheduleAction(
            () => {
                // The legacy bridge runs in this process, so count through the same usb 2.x addon
                // (never load usb 3.x next to it, see createCore). getDeviceList() only lists
                // devices: unlike WebUSB.getDevices() it never opens one, so it cannot close a
                // handle the bridge holds (usb 2.x shares device objects within the process).
                const devices = usb
                    .getDeviceList()
                    .filter(({ deviceDescriptor: { idVendor, idProduct } }) =>
                        TREZOR_USB_DESCRIPTORS.some(
                            d => d.vendorId === idVendor && d.productId === idProduct,
                        ),
                    );

                return devices.length === expected
                    ? Promise.resolve(null)
                    : Promise.reject(new Error('Condition not met'));
            },
            {
                deadline: Date.now() + 60_000,
                gap: 1000,
            },
        );
    };

    private waitForBridgeIsRunning = (expected: boolean) => {
        this.logger.log(`waiting for bridge ${expected ? 'start' : 'stop'}`);

        const client = new BridgeTransport({ id: 'test' });

        return scheduleAction(
            () =>
                // use BridgeTransport ping
                client.ping().then(res => {
                    if (expected !== res) {
                        throw new Error('Condition not met');
                    }

                    return null;
                }),
            {
                deadline: Date.now() + 60_000,
                gap: 1000,
            },
        );
    };
}

export const controller = new Controller();
