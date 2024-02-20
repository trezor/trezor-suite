interface SetupEmu {
    mnemonic?: string;
    pin?: string;
    passphrase_protection?: boolean;
    label?: string;
    needs_backup?: boolean;
}

interface StartEmu {
    version?: string;
    wipe?: boolean;
    save_screenshots?: boolean;
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

export const api = (controller: any) => ({
    setupEmu: async (options: SetupEmu) => {
        const defaults = {
            // some random empty seed. most of the test don't need any account history so it is better not to slow them down with all all seed
            mnemonic:
                'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
            pin: '',
            passphrase_protection: false,
            label: 'My Trevor',
            needs_backup: false,
        };

        // before setup, stop bridge and start it again after it. it has no performance hit
        // and avoids 'wrong previous session' errors from bridge. actual setup is done
        // through udp transport if bridge transport is not available
        await controller.send({ type: 'bridge-stop' });
        await controller.send({
            type: 'emulator-setup',
            ...defaults,
            ...options,
        });

        return null;
    },
    sendToAddressAndMineBlock: async (options: SendToAddressAndMineBlock) => {
        await controller.send({
            type: 'regtest-send-to-address',
            ...options,
        });

        return null;
    },
    mineBlocks: async (options: MineBlocks) => {
        await controller.send({
            type: 'regtest-mine-blocks',
            ...options,
        });

        return null;
    },
    generateBlock: async (options: GenerateBlock) => {
        await controller.send({
            type: 'regtest-generateblock',
            ...options,
        });

        return null;
    },
    startBridge: async (version?: string) => {
        await controller.send({ type: 'bridge-start', version });

        return null;
    },
    stopBridge: async () => {
        await controller.send({ type: 'bridge-stop' });

        return null;
    },
    startEmu: (arg?: StartEmu) => {
        const params = {
            type: 'emulator-start',
            version: '2-latest',
            ...arg,
        };

        return controller.send(params);
    },
    startEmuFromUrl: ({ url, model, wipe }: { url: string; model: string; wipe?: boolean }) =>
        controller.send({
            type: 'emulator-start-from-url',
            url,
            model,
            wipe,
        }),
    stopEmu: async () => {
        await controller.send({ type: 'emulator-stop' });

        return null;
    },
    wipeEmu: async () => {
        await controller.send({ type: 'emulator-wipe' });

        return null;
    },
    pressYes: async () => {
        await controller.send({ type: 'emulator-press-yes' });

        return null;
    },
    pressNo: async () => {
        await controller.send({ type: 'emulator-press-no' });

        return null;
    },
    swipeEmu: async (direction: 'up' | 'down' | 'left' | 'right') => {
        await controller.send({ type: 'emulator-swipe', direction });

        return null;
    },
    inputEmu: async (value: string) => {
        await controller.send({ type: 'emulator-input', value });

        return null;
    },
    clickEmu: async (options: ClickEmu) => {
        await controller.send({ type: 'emulator-click', ...options });

        return null;
    },
    resetDevice: async (options: any) => {
        await controller.send({ type: 'emulator-reset-device', ...options });

        return null;
    },
    readAndConfirmMnemonicEmu: async () => {
        await controller.send({ type: 'emulator-read-and-confirm-mnemonic' });

        return null;
    },
    readAndConfirmShamirMnemonicEmu: async (options: ReadAndConfirmShamirMnemonicEmu) => {
        await controller.send({
            type: 'emulator-read-and-confirm-shamir-mnemonic',
            ...options,
        });

        return null;
    },
    applySettings: async (options: ApplySettings) => {
        await controller.send({
            type: 'emulator-apply-settings',
            ...options,
        });

        return null;
    },
    selectNumOfWordsEmu: async (num: number) => {
        await controller.send({ type: 'emulator-select-num-of-words', num });

        return null;
    },
    getDebugState: async () => {
        const { response } = await controller.send({ type: 'emulator-get-debug-state' });

        return response;
    },

    logTestDetails: async (text: string) => {
        await controller.send({ type: 'log', text });

        return null;
    },
    trezorUserEnvConnect: async () => {
        await controller.connect();

        return null;
    },
    trezorUserEnvDisconnect: async () => {
        await controller.disconnect();

        return null;
    },
});
