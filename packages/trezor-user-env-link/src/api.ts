/* eslint-disable no-console */

import { TypedEmitter, resolveAfter } from '@trezor/utils';

import { type Firmwares, Model } from './types';
import { WebsocketClient, type WebsocketClientEvents } from './websocket-client';
export interface SetupEmu {
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

interface StartEmuType {
    type: 'emulator-start';
    version?: string;
    wipe: boolean;
    model: Model;
}

interface StartEmuFromUrl {
    url: string;
    model: Model;
    wipe: boolean;
}

interface StartEmuFromUrlType extends StartEmuFromUrl {
    type: 'emulator-start-from-url';
}

interface StartEmuFromBranch {
    branch: string;
    btcOnly: boolean;
    model: Model;
    wipe: boolean;
}

interface StartEmuFromBranchType extends StartEmuFromBranch {
    type: 'emulator-start-from-branch';
}

export type EmuStartOptsType = StartEmuType | StartEmuFromUrlType | StartEmuFromBranchType;

interface ClickEmu {
    x: number;
    y: number;
}

export interface SendToAddressAndMineBlock {
    address: string;
    btc_amount: number;
}

export interface MineBlocks {
    block_amount: number;
}

export interface GenerateBlock {
    address: string;
    txids: string[];
}

export interface ApplySettings {
    passphrase_always_on_device?: boolean;
}

export interface ReadAndConfirmShamirMnemonicEmu {
    shares: number;
    threshold: number;
}

export interface ReadAndConfirmAtomicShamirMnemonicEmu {
    shares: number;
    threshold: number;
}

type StartBridgeVersion = '2.0.33' | 'node-bridge';

export const MNEMONICS = {
    mnemonic_all: 'all all all all all all all all all all all all',
    mnemonic_12: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
    mnemonic_abandon:
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    mnemonic_immune: 'immune enlist rule measure fan swarm mandate track point menu security fan',
    mnemonic_academic:
        'academic again academic academic academic academic academic academic academic academic academic academic academic academic academic academic academic pecan provide remember',
};

export const DEFAULT_BRIDGE_VERSION = 'node-bridge';

// There's an ongoing problem with debug link & button requests race conditions
// Adding a delay to workaround this issue temporarily
// https://github.com/trezor/trezor-suite/issues/23270
const EMU_RACE_CONDITION_WORKAROUND_DELAY = 200;

export class TrezorUserEnvLinkClass extends TypedEmitter<WebsocketClientEvents> {
    private client: WebsocketClient;
    public firmwares?: Firmwares;
    public defaultModel: Model = Model.T2T1;

    public currentEmulatorSetup?: Partial<SetupEmu> = {};
    public currentEmulatorSettings: Partial<ApplySettings> = {};

    // todo: remove later, used in some of the tests
    public send: WebsocketClient['send'];

    constructor() {
        super();
        this.client = new WebsocketClient();

        this.client.on('firmwares', (firmwares: Firmwares) => {
            this.firmwares = firmwares;
        });

        this.client.on('disconnected', () => this.emit('disconnected'));

        // todo: legacy api, should be removed
        this.send = this.client.send.bind(this.client);
    }

    public async setupEmu(options?: SetupEmu) {
        const defaults = {
            pin: '',
            passphrase_protection: false,
            label: 'My Trevor',
            needs_backup: false,
        };

        // fallback to empty seed. most of the test don't need any account history so it is better not to slow them down with all all seed
        const mnemonic =
            typeof options?.mnemonic === 'string' && options.mnemonic.indexOf(' ') > 0
                ? options.mnemonic
                : //   @ts-expect-error
                  MNEMONICS[options?.mnemonic] || MNEMONICS.mnemonic_12;

        const finalOptions = {
            ...defaults,
            ...options,
            mnemonic,
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
    async startBridge(version: StartBridgeVersion = DEFAULT_BRIDGE_VERSION) {
        await this.client.send({ type: 'bridge-start', version });

        return null;
    }
    async stopBridge() {
        await this.client.send({ type: 'bridge-stop' });

        return null;
    }
    async startEmu(arg?: StartEmu) {
        const defaultV1Firmware = process.env.CANARY_FIRMWARE ? '1-main' : '1-latest';
        const defaultV2Firmware = process.env.CANARY_FIRMWARE ? '2-main' : '2-latest';

        const params = {
            type: 'emulator-start',
            model: this.defaultModel,
            version: arg?.model === Model.T1B1 ? defaultV1Firmware : defaultV2Firmware,
            ...arg,
        };

        console.log('Starting emulator with params', JSON.stringify(params));
        await this.client.send(params);

        if (params.wipe) {
            this.currentEmulatorSettings = {};
            this.currentEmulatorSetup = {};
        }

        return null;
    }
    async startEmuFromUrl({ url, model, wipe }: StartEmuFromUrl) {
        await this.client.send({
            type: 'emulator-start-from-url',
            url,
            model,
            wipe,
        });

        return null;
    }
    async startEmuFromBranch({ branch, btcOnly = false, model, wipe }: StartEmuFromBranch) {
        await this.client.send({
            type: 'emulator-start-from-branch',
            branch,
            btc_only: btcOnly,
            model,
            wipe,
        });

        return null;
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
        await resolveAfter(EMU_RACE_CONDITION_WORKAROUND_DELAY);
        await this.client.send({ type: 'emulator-press-yes' });

        return null;
    }
    async pressNo() {
        await resolveAfter(EMU_RACE_CONDITION_WORKAROUND_DELAY);
        await this.client.send({ type: 'emulator-press-no' });

        return null;
    }
    async swipeEmu(direction: 'up' | 'down' | 'left' | 'right') {
        await resolveAfter(EMU_RACE_CONDITION_WORKAROUND_DELAY);
        await this.client.send({ type: 'emulator-swipe', direction });

        return null;
    }
    async inputEmu(value: string) {
        await resolveAfter(EMU_RACE_CONDITION_WORKAROUND_DELAY);
        await this.client.send({ type: 'emulator-input', value });

        return null;
    }
    async clickEmu(options: ClickEmu) {
        await resolveAfter(EMU_RACE_CONDITION_WORKAROUND_DELAY);
        await this.client.send({ type: 'emulator-click', ...options });

        return null;
    }
    async resetDevice(options: any) {
        await resolveAfter(EMU_RACE_CONDITION_WORKAROUND_DELAY);
        await this.client.send({ type: 'emulator-reset-device', ...options });

        return null;
    }
    async readAndConfirmMnemonicEmu() {
        await resolveAfter(EMU_RACE_CONDITION_WORKAROUND_DELAY);
        await this.client.send({ type: 'emulator-read-and-confirm-mnemonic' });

        return null;
    }
    async readAndConfirmShamirMnemonicEmu(options: ReadAndConfirmShamirMnemonicEmu) {
        await resolveAfter(EMU_RACE_CONDITION_WORKAROUND_DELAY);
        await this.client.send({
            type: 'emulator-read-and-confirm-shamir-mnemonic',
            ...options,
        });

        return null;
    }
    async readAndConfirmAtomicShamirMnemonicEmu(options: ReadAndConfirmAtomicShamirMnemonicEmu) {
        await resolveAfter(EMU_RACE_CONDITION_WORKAROUND_DELAY);
        await this.client.send({
            type: 'emulator-read-and-confirm-atomic-shamir-mnemonic',
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
    async allowUnsafePaths() {
        await this.client.send({ type: 'emulator-allow-unsafe-paths' });

        return null;
    }
    async selectNumOfWordsEmu(num: number) {
        await resolveAfter(EMU_RACE_CONDITION_WORKAROUND_DELAY * 2);
        await this.client.send({ type: 'emulator-select-num-of-words', num });

        return null;
    }

    async getScreenContent() {
        const { response } = await this.client.send({ type: 'emulator-get-screen-content' });

        return response;
    }

    async getDebugState() {
        await resolveAfter(EMU_RACE_CONDITION_WORKAROUND_DELAY);
        const { response } = await this.client.send({ type: 'emulator-get-debug-state' });

        return response;
    }

    async getPairingInfo(thp_channel_id: string, nfcData?: string) {
        // user-env expects something, cannot be undefined
        const d = nfcData ? Buffer.from(nfcData, 'hex') : undefined;
        const [nfc_secret_host, handshake_hash] = d
            ? [d.subarray(0, 16), d.subarray(16)].map(b => b.toString('hex'))
            : [null, null];

        const { response } = await this.client.send({
            type: 'emulator-get-pairing-info',
            thp_channel_id,
            handshake_hash,
            nfc_secret_host,
        });

        return {
            ...response,
            code_entry_code: Number(response.code_entry_code).toString().padStart(6, '0'),
        };
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
