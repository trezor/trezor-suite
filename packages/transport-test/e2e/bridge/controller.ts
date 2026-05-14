/* eslint no-console: 0 */

import { WebUSB } from 'usb';

import { protobufManager } from '@trezor/protobuf';
import * as bitcoinProto from '@trezor/protobuf/src/definitions/messages-bitcoin_pb';
import * as commonProto from '@trezor/protobuf/src/definitions/messages-common_pb';
import * as managementProto from '@trezor/protobuf/src/definitions/messages-management_pb';
import * as messagesProto from '@trezor/protobuf/src/definitions/messages_pb';
import { BridgeTransport } from '@trezor/transport';
import { TrezordNode } from '@trezor/transport-bridge/src';
import { TrezorUserEnvLinkClass } from '@trezor/trezor-user-env-link';
import { Log, scheduleAction } from '@trezor/utils';

export const env = {
    USE_HW: process.env.USE_HW === 'true',
    USE_NODE_BRIDGE: process.env.USE_NODE_BRIDGE === 'true',
};

console.log('env', env);

const webusb = new WebUSB({
    allowAllDevices: true, // return all devices, not only authorized
});

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
        startBridge: typeof TrezorUserEnvLinkClass.prototype.startBridge;
        stopBridge: typeof TrezorUserEnvLinkClass.prototype.stopBridge;
        startEmu: typeof TrezorUserEnvLinkClass.prototype.startEmu;
        stopEmu: typeof TrezorUserEnvLinkClass.prototype.stopEmu;
    };

    constructor() {
        super();

        this.logger = console;

        protobufManager.load([commonProto, messagesProto, managementProto, bitcoinProto]);

        this.originalApi = {
            connect: super.connect.bind(this),
            startBridge: super.startBridge.bind(this),
            stopBridge: super.stopBridge.bind(this),
            startEmu: super.startEmu.bind(this),
            stopEmu: super.stopEmu.bind(this),
        };

        this.connect = !env.USE_HW ? this.originalApi.connect : () => Promise.resolve(null);

        this.startBridge =
            !env.USE_HW && !env.USE_NODE_BRIDGE
                ? () => this.originalApi.startBridge('2.0.33')
                : env.USE_NODE_BRIDGE
                  ? async () => {
                        this.nodeBridge = new TrezordNode({
                            api: !env.USE_HW ? 'udp' : 'usb',
                            logger: new Log('test-bridge', false),
                        });

                        await this.nodeBridge.start();

                        // todo: this shouldn't be here, nodeBridge should be started when start resolves
                        await this.waitForBridgeIsRunning(true);

                        return null;
                    }
                  : () => this.waitForBridgeIsRunning(true);

        this.stopBridge =
            !env.USE_HW && !env.USE_NODE_BRIDGE
                ? this.originalApi.stopBridge
                : env.USE_NODE_BRIDGE
                  ? async () => {
                        await this.nodeBridge?.stop();

                        // todo: this shouldn't be here, nodeBridge should be stopped when stop resolves
                        await this.waitForBridgeIsRunning(false);

                        return null;
                    }
                  : () => this.waitForBridgeIsRunning(false);

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
            async () => {
                const devices = (await webusb.getDevices()).filter(d =>
                    d.productName.toLowerCase().includes('trezor'),
                );

                if (devices.length === expected) {
                    return null;
                }
                throw new Error('Condition not met');
            },
            {
                deadline: Date.now() + 60_000,
                gap: 1000,
            },
        );
    };

    private waitForBridgeIsRunning = (expected: boolean) => {
        this.logger.log(
            `${env.USE_HW && !env.USE_NODE_BRIDGE ? '[MANUAL ACTION REQUIRED] ' : ''} waiting for bridge ${expected ? 'start' : 'stop'}`,
        );

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
