/* eslint-disable no-console */

import semverValid from 'semver/functions/valid';
import semverRSort from 'semver/functions/rsort';

import { TypedEmitter } from '@trezor/utils';

import { Model, Firmwares } from './types';
import { WebsocketClient, WebsocketClientEvents } from './websocket-client';
interface SetupEmu {
    mnemonic?: string;
    pin?: string;
    passphrase_protection?: boolean;
    label?: string;
    needs_backup?: boolean;
}

export interface StartEmu {
    version?: string;
    wipe?: boolean;
    save_screenshots?: boolean;
    model?: Model;
}

interface StartEmuFromUrl extends Omit<StartEmu, 'version'> {
    url: string;
}

interface ClickEmu {
    x: number;
    y: number;
}

interface SendToAddressAndMineBlock {
    address: string;
    btc_amount: number;
}

interface MineBlocks {
    block_amount: number;
}

interface GenerateBlock {
    address: string;
    txids: string[];
}

interface ApplySettings {
    passphrase_always_on_device?: boolean;
}

interface ReadAndConfirmShamirMnemonicEmu {
    shares: number;
    threshold: number;
}

export class TrezorUserEnvLinkClass extends TypedEmitter<WebsocketClientEvents> {
    private client: WebsocketClient;
    public firmwares?: Firmwares;
    private defaultFirmware?: string;
    private defaultModel: Model = 'T2T1';

    public currentEmulatorSetup: Partial<SetupEmu> = {};
    public currentEmulatorSettings: Partial<ApplySettings> = {};

    // todo: remove later, used in some of the tests
    public send: WebsocketClient['send'];

    constructor() {
        super();
        this.client = new WebsocketClient();

        this.client.on('firmwares', (firmwares: Firmwares) => {
            this.firmwares = firmwares;
            // select the highest version from the list of available firmwares.
            // this is the version that is likely to be the newest production.
            this.defaultFirmware = semverRSort(
                this.firmwares[this.defaultModel].filter(fw => semverValid(fw)),
            )[0];
        });

        this.client.on('disconnected', () => this.emit('disconnected'));

        // todo: legacy api, should be removed
        this.send = this.client.send.bind(this.client);
    }

    public async setupEmu(options: SetupEmu) {
        const defaults = {
            // some random empty seed. most of the test don't need any account history so it is better not to slow them down with all all seed
            mnemonic:
                'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
            pin: '',
            passphrase_protection: false,
            label: 'My Trevor',
            needs_backup: false,
        };
        const finalOptions = {
            ...defaults,
            ...options,
        };

        if (JSON.stringify(this.currentEmulatorSetup) === JSON.stringify(finalOptions)) {
            console.log('Emulator already set up with the same options, skipping setup');

            return Promise.resolve();
        }

        // before setup, stop bridge and start it again after it. it has no performance hit
        // and avoids 'wrong previous session' errors from bridge. actual setup is done
        // through udp transport if bridge transport is not available
        await this.client.send({ type: 'bridge-stop' });

        await this.client.send({
            type: 'emulator-setup',
            ...finalOptions,
        });

        this.currentEmulatorSetup = options;

        return null;
    }
    async sendToAddressAndMineBlock(options: SendToAddressAndMineBlock) {
        await this.client.send({
            type: 'regtest-send-to-address',
            ...options,
        });

        return null;
    }
    async mineBlocks(options: MineBlocks) {
        await this.client.send({
            type: 'regtest-mine-blocks',
            ...options,
        });

        return null;
    }
    async generateBlock(options: GenerateBlock) {
        await this.client.send({
            type: 'regtest-generateblock',
            ...options,
        });

        return null;
    }
    async startBridge(version?: string) {
        await this.client.send({ type: 'bridge-start', version });

        return null;
    }
    async stopBridge() {
        await this.client.send({ type: 'bridge-stop' });

        return null;
    }
    async startEmu(arg?: StartEmu) {
        const params = {
            type: 'emulator-start',
            model: this.defaultModel,
            version: this.defaultFirmware || '2-main',
            ...arg,
        };

        await this.client.send(params);

        if (params.wipe) {
            this.currentEmulatorSettings = {};
            this.currentEmulatorSetup = {};
        }

        return null;
    }
    startEmuFromUrl({ url, model, wipe }: StartEmuFromUrl) {
        return this.client.send({
            type: 'emulator-start-from-url',
            url,
            model,
            wipe,
        });
    }

    async stopEmu() {
        await this.client.send({ type: 'emulator-stop' });

        return null;
    }
    async wipeEmu() {
        this.currentEmulatorSettings = {};
        this.currentEmulatorSetup = {};
        await this.client.send({ type: 'emulator-wipe' });

        return null;
    }
    async pressYes() {
        await this.client.send({ type: 'emulator-press-yes' });

        return null;
    }
    async pressNo() {
        await this.client.send({ type: 'emulator-press-no' });

        return null;
    }
    async swipeEmu(direction: 'up' | 'down' | 'left' | 'right') {
        await this.client.send({ type: 'emulator-swipe', direction });

        return null;
    }
    async inputEmu(value: string) {
        await this.client.send({ type: 'emulator-input', value });

        return null;
    }
    async clickEmu(options: ClickEmu) {
        await this.client.send({ type: 'emulator-click', ...options });

        return null;
    }
    async resetDevice(options: any) {
        await this.client.send({ type: 'emulator-reset-device', ...options });

        return null;
    }
    async readAndConfirmMnemonicEmu() {
        await this.client.send({ type: 'emulator-read-and-confirm-mnemonic' });

        return null;
    }
    async readAndConfirmShamirMnemonicEmu(options: ReadAndConfirmShamirMnemonicEmu) {
        await this.client.send({
            type: 'emulator-read-and-confirm-shamir-mnemonic',
            ...options,
        });

        return null;
    }
    async applySettings(options: ApplySettings) {
        if (JSON.stringify(this.currentEmulatorSettings) === JSON.stringify(options)) {
            console.log('Emulator already has the same settings applied, skipping setup');

            return Promise.resolve();
        }
        await this.client.send({
            type: 'emulator-apply-settings',
            ...options,
        });
        this.currentEmulatorSettings = options;

        return null;
    }
    async selectNumOfWordsEmu(num: number) {
        await this.client.send({ type: 'emulator-select-num-of-words', num });

        return null;
    }
    async getDebugState() {
        const { response } = await this.client.send({ type: 'emulator-get-debug-state' });

        return response;
    }

    async logTestDetails(text: string) {
        await this.client.send({ type: 'log', text });

        return null;
    }
    async connect() {
        await this.client.connect();

        return null;
    }
    async disconnect() {
        await this.client.disconnect();

        return null;
    }

    // legacy api, should be removed probably
    dispose() {
        this.disconnect();
    }
}

export const TrezorUserEnvLink = new TrezorUserEnvLinkClass();
